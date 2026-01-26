import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/client";
import { verifyTelegramInitData } from "@/lib/telegram/verifyInitData";
import { z } from "zod";
import { isMaintenanceMode } from "@/lib/maintenance";
import { getSession } from "@/lib/auth/guard";
import { getDemoSessionFromRequest } from "@/lib/api/demo-fetch";

interface Review {
  id: string;
  product_id: string | null;
  telegram_user_id: string;
  username: string | null;
  rating: number;
  content: string;
  status: "pending" | "published" | "rejected";
  created_at: string;
}

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { error: "Service en maintenance" },
          { status: 503 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("product_id");
    const demoSessionId = getDemoSessionFromRequest(request);

    let sql = `SELECT * FROM reviews`;
    const params: string[] = [];
    const conditions: string[] = [];

    // Filter by demo session if present (isolation)
    if (demoSessionId) {
      params.push(demoSessionId);
      conditions.push(`demo_session_id = $${params.length}`);
    }

    // Filter by status (default to published for public access)
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    } else {
      conditions.push(`status = 'published'`);
    }

    if (productId) {
      params.push(productId);
      conditions.push(`product_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY created_at DESC`;

    const reviews = await query<Review>(sql, params);

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// Review creation schema
const createReviewSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(1000),
  initData: z.string().optional(),
});

// POST /api/reviews - Create new review
export async function POST(request: NextRequest) {
  try {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      return NextResponse.json(
        { error: "Service en maintenance" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Get demo session ID if present
    const demoSessionId = getDemoSessionFromRequest(request);

    // Verify Telegram user if initData provided
    let telegramUserId = "anonymous";
    let username: string | null = null;

    // Dev mode: accept requests without Telegram verification
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      telegramUserId = demoSessionId || "dev_user_123";
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

    // Check if product exists (if product_id provided)
    if (parsed.data.product_id) {
      const product = await queryOne<{ id: string }>(
        `SELECT id FROM products WHERE id = $1`,
        [parsed.data.product_id]
      );

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }
    }

    const review = await queryOne<Review>(
      `INSERT INTO reviews (product_id, telegram_user_id, username, rating, content, status, demo_session_id)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [
        parsed.data.product_id || null,
        telegramUserId,
        username,
        parsed.data.rating,
        parsed.data.content,
        demoSessionId || null,
      ]
    );

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Reviews POST error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
