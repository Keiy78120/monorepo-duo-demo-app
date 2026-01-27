import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/guard";
import { query } from "@/lib/db/client";

/**
 * GET /api/moderators
 * List all moderators
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const moderators = await query(
      `SELECT id, telegram_user_id, role, added_by, created_at, updated_at
       FROM moderators
       ORDER BY created_at DESC`
    );
    return NextResponse.json(moderators);
  } catch (error) {
    console.error("Failed to fetch moderators:", error);
    return NextResponse.json({ error: "Failed to fetch moderators" }, { status: 500 });
  }
}

/**
 * POST /api/moderators
 * Add a new moderator
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { telegram_user_id, role, added_by } = body;

    // Validation
    if (!telegram_user_id || !role) {
      return NextResponse.json(
        { error: "telegram_user_id and role are required" },
        { status: 400 }
      );
    }

    if (!["moderator", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "role must be 'moderator' or 'admin'" },
        { status: 400 }
      );
    }

    // Check if moderator already exists
    const existing = await query(
      `SELECT id FROM moderators WHERE telegram_user_id = $1`,
      [telegram_user_id]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Moderator already exists" },
        { status: 409 }
      );
    }

    // Insert new moderator
    const result = await query(
      `INSERT INTO moderators (telegram_user_id, role, added_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [telegram_user_id, role, added_by || null]
    );

    const moderator = Array.isArray(result) ? result[0] : result;
    return NextResponse.json(moderator, { status: 201 });
  } catch (error) {
    console.error("Failed to add moderator:", error);
    return NextResponse.json({ error: "Failed to add moderator" }, { status: 500 });
  }
}

/**
 * DELETE /api/moderators
 * Remove a moderator
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await query(`DELETE FROM moderators WHERE id = $1`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete moderator:", error);
    return NextResponse.json({ error: "Failed to delete moderator" }, { status: 500 });
  }
}
