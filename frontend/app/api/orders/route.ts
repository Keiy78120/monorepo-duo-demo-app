import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/client";
import { verifyTelegramInitData } from "@/lib/telegram/verifyInitData";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";
import { isMaintenanceMode } from "@/lib/maintenance";
import type { Order, Driver } from "@/lib/db/types";

type OrderWithDriver = Order & {
  driver_name?: string | null;
};

interface ProductBasic {
  id: string;
  price: number;
  is_active: boolean;
}

async function cleanupOldOrders() {
  await execute(`DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 day'`);
}

async function getOrderChatId(): Promise<string | null> {
  const row = await queryOne<{ value: string }>(
    `SELECT value FROM settings WHERE key = $1`,
    ["order_chat_id"]
  );

  if (row?.value) {
    let parsed: unknown = row.value;
    if (typeof row.value === "string") {
      try {
        parsed = JSON.parse(row.value);
      } catch {
        parsed = row.value;
      }
    }
    const normalized = typeof parsed === "number" ? String(parsed) : String(parsed || "").trim();
    if (normalized) return normalized;
  }

  const fallback = process.env.ADMIN_TELEGRAM_IDS?.split(",")[0]?.trim();
  return fallback || null;
}

function formatOrderMessage(input: {
  address?: string | null;
  items: Array<{ name: string; quantity: number }>;
  username?: string | null;
  telegramUserId: string;
  dailyOrderNumber: number;
}) {
  const lines = input.items.map((item) => `- ${item.name} x${item.quantity}`);
  const username = input.username ? `@${input.username}` : `user_${input.telegramUserId}`;
  const address = input.address?.trim() || "Adresse non fournie";

  return [
    `ADRESSE: ${address}`,
    "PRODUITS COMMANDÉS:",
    lines.join("\n") || "-",
    `USERNAME: ${username}`,
    `NUMERO DE COMMANDE: #${input.dailyOrderNumber}`,
  ].join("\n");
}

// Order item schema
const orderItemSchema = z.object({
  product_id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  price: z.number().int().min(0),
});

// Order creation schema
const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  total: z.number().int().min(0),
  currency: z.string().default("EUR"),
  notes: z.string().optional(),
  delivery_address: z.string().min(1, "Delivery address is required"),
  initData: z.string().optional(),
});

// GET /api/orders - List orders (admin only)
export async function GET(request: NextRequest) {
  try {
    await cleanupOldOrders();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date"); // Format: YYYY-MM-DD
    const driverId = searchParams.get("driver_id");

    const conditions: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(status);
    }

    if (date) {
      conditions.push(`o.order_day = $${paramIndex++}`);
      params.push(date);
    }

    if (driverId) {
      if (driverId === "unassigned") {
        conditions.push(`o.driver_id IS NULL`);
      } else {
        conditions.push(`o.driver_id = $${paramIndex++}`);
        params.push(driverId);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const orders = await query<OrderWithDriver>(sql, params);

    // Also fetch active drivers for the filter dropdown
    const drivers = await query<Driver>(
      `SELECT * FROM drivers WHERE is_active = true ORDER BY name ASC`
    );

    return NextResponse.json({ orders, drivers });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      return NextResponse.json(
        { error: "Service en maintenance" },
        { status: 503 }
      );
    }

    await cleanupOldOrders();

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify Telegram user if initData provided
    let telegramUserId = "anonymous";
    let username: string | null = null;

    // Dev mode: accept requests without Telegram verification
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      telegramUserId = "dev_user_123";
      username = "dev_user";
    } else if (parsed.data.initData && process.env.TELEGRAM_BOT_TOKEN) {
      const { valid, data } = verifyTelegramInitData(
        parsed.data.initData,
        process.env.TELEGRAM_BOT_TOKEN
      );

      if (valid && data?.user) {
        telegramUserId = data.user.id.toString();
        username = data.user.username || null;
      }
    }

    // Validate that all products exist and are active
    const productIds = parsed.data.items.map((item) => item.product_id);
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(", ");
    const products = await query<ProductBasic>(
      `SELECT id, price, is_active FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    // Check all products exist and are active
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of parsed.data.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 400 }
        );
      }
      if (!product.is_active) {
        return NextResponse.json(
          { error: `Product ${item.name} is no longer available` },
          { status: 400 }
        );
      }
    }

    // Calculate total to verify client-side calculation
    const calculatedTotal = parsed.data.items.reduce((sum, item) => {
      const product = productMap.get(item.product_id);
      return sum + (product?.price || 0) * item.quantity;
    }, 0);

    // Allow small discrepancy for rounding
    if (Math.abs(calculatedTotal - parsed.data.total) > 1) {
      return NextResponse.json({ error: "Order total mismatch" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];
    const lastOrder = await queryOne<{ daily_order_number: number }>(
      `SELECT daily_order_number FROM orders WHERE order_day = $1 ORDER BY daily_order_number DESC LIMIT 1`,
      [today]
    );
    const dailyOrderNumber = (lastOrder?.daily_order_number ?? 0) + 1;

    // Insert order
    const order = await queryOne<Order>(
      `INSERT INTO orders (telegram_user_id, username, items, total, currency, notes, delivery_address, status, order_day, daily_order_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9)
       RETURNING *`,
      [
        telegramUserId,
        username,
        JSON.stringify(parsed.data.items),
        calculatedTotal,
        parsed.data.currency,
        parsed.data.notes || null,
        parsed.data.delivery_address,
        today,
        dailyOrderNumber,
      ]
    );

    const orderChatId = await getOrderChatId();
    if (!orderChatId || !process.env.TELEGRAM_BOT_TOKEN) {
      await execute(`DELETE FROM orders WHERE id = $1`, [order?.id]);
      return NextResponse.json(
        { error: "Order recipient not configured" },
        { status: 400 }
      );
    }

    const message = formatOrderMessage({
      address: parsed.data.delivery_address,
      items: parsed.data.items,
      username,
      telegramUserId,
      dailyOrderNumber,
    });

    const sendResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: orderChatId,
          text: message,
          disable_web_page_preview: true,
        }),
      }
    );

    if (!sendResponse.ok) {
      await execute(`DELETE FROM orders WHERE id = $1`, [order?.id]);
      return NextResponse.json(
        { error: "Failed to notify Telegram" },
        { status: 502 }
      );
    }

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
