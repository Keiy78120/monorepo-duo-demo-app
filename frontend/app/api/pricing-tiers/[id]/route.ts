import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, execute } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/guard";
import type { PricingTier } from "@/lib/supabase/database.types";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/pricing-tiers/[id] - Get single pricing tier
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const tiers = await query<PricingTier>(
      "SELECT * FROM pricing_tiers WHERE id = $1",
      [id]
    );

    if (tiers.length === 0) {
      return NextResponse.json(
        { error: "Pricing tier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(tiers[0]);
  } catch (error) {
    console.error("Error fetching pricing tier:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing tier" },
      { status: 500 }
    );
  }
}

// PATCH /api/pricing-tiers/[id] - Update pricing tier (Admin only)
const updateTierSchema = z.object({
  quantity_grams: z.number().int().positive().optional(),
  price: z.number().int().min(0).optional(),
  is_custom_price: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const data = updateTierSchema.parse(body);

    // Check if tier exists
    const existing = await query<PricingTier>(
      "SELECT * FROM pricing_tiers WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Pricing tier not found" },
        { status: 404 }
      );
    }

    // Check quantity uniqueness if updating quantity
    if (data.quantity_grams !== undefined) {
      const quantityExists = await query<PricingTier>(
        "SELECT id FROM pricing_tiers WHERE product_id = $1 AND quantity_grams = $2 AND id != $3",
        [existing[0].product_id, data.quantity_grams, id]
      );

      if (quantityExists.length > 0) {
        return NextResponse.json(
          { error: "A pricing tier with this quantity already exists for this product" },
          { status: 400 }
        );
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.quantity_grams !== undefined) {
      updates.push(`quantity_grams = $${paramIndex++}`);
      values.push(data.quantity_grams);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.is_custom_price !== undefined) {
      updates.push(`is_custom_price = $${paramIndex++}`);
      values.push(data.is_custom_price);
    }
    if (data.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(data.sort_order);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query<PricingTier>(
      `UPDATE pricing_tiers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json(result[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating pricing tier:", error);
    return NextResponse.json(
      { error: "Failed to update pricing tier" },
      { status: 500 }
    );
  }
}

// DELETE /api/pricing-tiers/[id] - Delete pricing tier (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    // Check if tier exists
    const existing = await query<PricingTier>(
      "SELECT id FROM pricing_tiers WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Pricing tier not found" },
        { status: 404 }
      );
    }

    await execute("DELETE FROM pricing_tiers WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting pricing tier:", error);
    return NextResponse.json(
      { error: "Failed to delete pricing tier" },
      { status: 500 }
    );
  }
}
