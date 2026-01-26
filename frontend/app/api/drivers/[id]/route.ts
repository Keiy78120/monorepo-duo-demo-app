import { NextRequest, NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";
import type { Driver } from "@/lib/db/types";

// Update driver schema
const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

// GET /api/drivers/[id] - Get single driver
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

    const driver = await queryOne<Driver>(
      `SELECT * FROM drivers WHERE id = $1`,
      [id]
    );

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("Driver GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 }
    );
  }
}

// PATCH /api/drivers/[id] - Update driver
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
    const parsed = updateDriverSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (parsed.data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(parsed.data.name);
    }
    if (parsed.data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(parsed.data.phone);
    }
    if (parsed.data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(parsed.data.is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);

    const driver = await queryOne<Driver>(
      `UPDATE drivers SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("Driver PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}

// DELETE /api/drivers/[id] - Delete driver
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if driver is assigned to any orders
    const orderCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders WHERE driver_id = $1`,
      [id]
    );

    if (orderCount && parseInt(orderCount.count) > 0) {
      // Instead of deleting, deactivate the driver
      const driver = await queryOne<Driver>(
        `UPDATE drivers SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return NextResponse.json({
        driver,
        message: "Driver has assigned orders and was deactivated instead of deleted",
      });
    }

    const rowCount = await execute(
      `DELETE FROM drivers WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Driver DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}
