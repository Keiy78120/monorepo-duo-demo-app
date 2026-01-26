import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";
import type { Order, Driver } from "@/lib/db/types";

type OrderWithDriver = Order & { driver_name?: string | null };

// Update order schema
const updateOrderSchema = z.object({
  status: z
    .enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"])
    .optional(),
  driver_id: z.string().uuid().nullable().optional(),
  notes: z.string().optional().nullable(),
  delivery_address: z.string().optional().nullable(),
});

// GET /api/orders/[id] - Get single order with driver info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const order = await queryOne<OrderWithDriver>(
      `SELECT o.*, d.name as driver_name
       FROM orders o
       LEFT JOIN drivers d ON o.driver_id = d.id
       WHERE o.id = $1`,
      [id]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get driver details if assigned
    let driver: Driver | null = null;
    if (order.driver_id) {
      driver = await queryOne<Driver>(
        `SELECT * FROM drivers WHERE id = $1`,
        [order.driver_id]
      );
    }

    return NextResponse.json({ order, driver });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order (status, driver, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (parsed.data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(parsed.data.status);
    }
    if (parsed.data.driver_id !== undefined) {
      updates.push(`driver_id = $${paramIndex++}`);
      values.push(parsed.data.driver_id);
    }
    if (parsed.data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(parsed.data.notes);
    }
    if (parsed.data.delivery_address !== undefined) {
      updates.push(`delivery_address = $${paramIndex++}`);
      values.push(parsed.data.delivery_address);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);

    const order = await queryOne<Order>(
      `UPDATE orders SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get driver details if assigned
    let driver: Driver | null = null;
    if (order.driver_id) {
      driver = await queryOne<Driver>(
        `SELECT * FROM drivers WHERE id = $1`,
        [order.driver_id]
      );
    }

    return NextResponse.json({ order, driver });
  } catch (error) {
    console.error("Order PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
