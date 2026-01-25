import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/client";
import type { Order } from "@/lib/supabase/database.types";

// GET /api/orders/user - Get orders for current Telegram user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get("telegram_user_id");

    if (!telegramUserId) {
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ orders: [] });
      }
      return NextResponse.json({ error: "telegram_user_id required" }, { status: 400 });
    }

    const sql = `
      SELECT o.*
      FROM orders o
      WHERE o.telegram_user_id = $1
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    const orders = await query<Order>(sql, [telegramUserId]);

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("User orders GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
