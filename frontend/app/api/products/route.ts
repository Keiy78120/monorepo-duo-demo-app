import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { isMaintenanceMode } from "@/lib/maintenance";
import { z } from "zod";
import type { Product } from "@/lib/supabase/database.types";

// GET /api/products - List all active products (public)
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
    const category = searchParams.get("category");
    const categoryId = searchParams.get("category_id");
    const activeOnly = searchParams.get("active") !== "false";

    let sql = `SELECT * FROM products`;
    const params: string[] = [];
    const conditions: string[] = [];

    if (activeOnly) {
      conditions.push(`is_active = true`);
    }

    if (category && category !== "all") {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }

    if (categoryId) {
      params.push(categoryId);
      conditions.push(`category_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY created_at DESC`;

    const products = await query<Product>(sql, params);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// Product creation schema - updated for cannabis pricing
const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  variety: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).default(0),
  currency: z.string().default("EUR"),
  images: z.array(z.string()).default([]),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  stock_quantity: z.number().int().min(0).optional().nullable(),
  tags: z.array(z.string()).default([]),
  farm_label: z.string().optional().nullable(),
  origin_flag: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  // Cannabis pricing fields
  cost_price_per_gram: z.number().int().min(0).default(0),
  margin_percentage: z.number().int().min(0).max(1000).default(50),
});

// POST /api/products - Create new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM products WHERE slug = $1`,
      [parsed.data.slug]
    );

    if (existing) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 409 }
      );
    }

    const product = await queryOne<Product>(
      `INSERT INTO products (
        name, slug, variety, description, price, currency, images,
        category, category_id, stock_quantity, tags, farm_label, origin_flag, is_active,
        cost_price_per_gram, margin_percentage
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        parsed.data.name,
        parsed.data.slug,
        parsed.data.variety || null,
        parsed.data.description || null,
        parsed.data.price,
        parsed.data.currency,
        JSON.stringify(parsed.data.images),
        parsed.data.category || null,
        parsed.data.category_id || null,
        parsed.data.stock_quantity ?? null,
        parsed.data.tags,
        parsed.data.farm_label || null,
        parsed.data.origin_flag || null,
        parsed.data.is_active,
        parsed.data.cost_price_per_gram,
        parsed.data.margin_percentage,
      ]
    );

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);

    // Extract more detailed error message
    let errorMessage = "Failed to create product";
    if (error instanceof Error) {
      // Check for common database errors
      if (error.message.includes("unique constraint") || error.message.includes("duplicate key")) {
        errorMessage = "Un produit avec ce slug existe déjà";
        return NextResponse.json({ error: errorMessage }, { status: 409 });
      }
      if (error.message.includes("foreign key") || error.message.includes("violates foreign key")) {
        errorMessage = "La catégorie spécifiée n'existe pas";
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      // Include error details in development
      if (process.env.NODE_ENV === "development") {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
