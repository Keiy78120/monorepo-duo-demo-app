import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, execute } from "@/lib/db/client";
import { getSession, requireAuth } from "@/lib/auth/guard";
import { isMaintenanceMode } from "@/lib/maintenance";
import type { ProductCategory } from "@/lib/db/types";

// GET /api/categories - List all categories
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
    const activeOnly = searchParams.get("active") !== "false";

    let sql = `
      SELECT * FROM product_categories
      ${activeOnly ? "WHERE is_active = true" : ""}
      ORDER BY sort_order ASC, name ASC
    `;

    const categories = await query<ProductCategory>(sql);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category (Admin only)
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const data = createCategorySchema.parse(body);

    // Check if slug already exists
    const existing = await query<ProductCategory>(
      "SELECT id FROM product_categories WHERE slug = $1",
      [data.slug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "A category with this slug already exists" },
        { status: 400 }
      );
    }

    const result = await query<ProductCategory>(
      `INSERT INTO product_categories (name, slug, description, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.description || null,
        data.sort_order ?? 0,
        data.is_active ?? true,
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
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
