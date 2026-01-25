import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, execute } from "@/lib/db/client";
import { getSession, requireAuth } from "@/lib/auth/guard";
import { isMaintenanceMode } from "@/lib/maintenance";
import type { PricingTier } from "@/lib/supabase/database.types";

// GET /api/pricing-tiers - List pricing tiers (optionally filter by product)
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
    const productId = searchParams.get("product_id");

    let sql = "SELECT * FROM pricing_tiers";
    const values: string[] = [];

    if (productId) {
      sql += " WHERE product_id = $1";
      values.push(productId);
    }

    sql += " ORDER BY sort_order ASC, quantity_grams ASC";

    const tiers = await query<PricingTier>(sql, values);
    return NextResponse.json(tiers);
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing tiers" },
      { status: 500 }
    );
  }
}

// POST /api/pricing-tiers - Create a new pricing tier (Admin only)
const createTierSchema = z.object({
  product_id: z.string().uuid(),
  quantity_grams: z.number().int().positive(),
  price: z.number().int().min(0),
  is_custom_price: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = createTierSchema.parse(body);

    // Check if product exists
    const productExists = await query<{ id: string }>(
      "SELECT id FROM products WHERE id = $1",
      [data.product_id]
    );

    if (productExists.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if tier with same quantity already exists for this product
    const existing = await query<PricingTier>(
      "SELECT id FROM pricing_tiers WHERE product_id = $1 AND quantity_grams = $2",
      [data.product_id, data.quantity_grams]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A pricing tier with this quantity already exists for this product" },
        { status: 400 }
      );
    }

    const result = await query<PricingTier>(
      `INSERT INTO pricing_tiers (product_id, quantity_grams, price, is_custom_price, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.product_id,
        data.quantity_grams,
        data.price,
        data.is_custom_price ?? false,
        data.sort_order ?? 0,
      ]
    );

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating pricing tier:", error);
    return NextResponse.json(
      { error: "Failed to create pricing tier" },
      { status: 500 }
    );
  }
}

// POST /api/pricing-tiers/batch - Create/update multiple pricing tiers (Admin only)
const batchTierSchema = z.object({
  product_id: z.string().uuid(),
  tiers: z.array(
    z.object({
      quantity_grams: z.number().int().positive(),
      price: z.number().int().min(0),
      is_custom_price: z.boolean().optional(),
    })
  ),
});

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = batchTierSchema.parse(body);

    // Check if product exists
    const productExists = await query<{ id: string }>(
      "SELECT id FROM products WHERE id = $1",
      [data.product_id]
    );

    if (productExists.length === 0) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete existing tiers for this product
    await execute("DELETE FROM pricing_tiers WHERE product_id = $1", [
      data.product_id,
    ]);

    // Insert new tiers
    const insertedTiers: PricingTier[] = [];

    for (let i = 0; i < data.tiers.length; i++) {
      const tier = data.tiers[i];
      const result = await query<PricingTier>(
        `INSERT INTO pricing_tiers (product_id, quantity_grams, price, is_custom_price, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          data.product_id,
          tier.quantity_grams,
          tier.price,
          tier.is_custom_price ?? false,
          i,
        ]
      );
      insertedTiers.push(result[0]);
    }

    return NextResponse.json(insertedTiers);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error batch updating pricing tiers:", error);
    return NextResponse.json(
      { error: "Failed to update pricing tiers" },
      { status: 500 }
    );
  }
}
