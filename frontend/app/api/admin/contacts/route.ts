import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { query } from "@/lib/db/client";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to select is_admin, fallback if column doesn't exist
  try {
    const contacts = await query(
      `SELECT
        telegram_user_id,
        username,
        first_name,
        last_name,
        language_code,
        is_premium,
        is_admin,
        first_seen_at,
        last_seen_at,
        visits_count
       FROM telegram_contacts
       ORDER BY last_seen_at DESC
       LIMIT 500`
    );
    return NextResponse.json(contacts);
  } catch {
    // Fallback without is_admin column
    const contacts = await query(
      `SELECT
        telegram_user_id,
        username,
        first_name,
        last_name,
        language_code,
        is_premium,
        false as is_admin,
        first_seen_at,
        last_seen_at,
        visits_count
       FROM telegram_contacts
       ORDER BY last_seen_at DESC
       LIMIT 500`
    );
    return NextResponse.json(contacts);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { telegram_user_id, is_admin } = body;

    if (!telegram_user_id) {
      return NextResponse.json({ error: "telegram_user_id required" }, { status: 400 });
    }

    // First ensure the column exists
    await query(`
      ALTER TABLE telegram_contacts
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `).catch(() => {
      // Column might already exist, ignore error
    });

    // Update admin status
    await query(
      `UPDATE telegram_contacts
       SET is_admin = $1
       WHERE telegram_user_id = $2`,
      [is_admin === true, telegram_user_id]
    );

    return NextResponse.json({ success: true, telegram_user_id, is_admin });
  } catch (error) {
    console.error("Failed to update admin status:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
