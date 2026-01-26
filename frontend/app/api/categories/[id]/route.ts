import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, execute } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/guard";
import type { ProductCategory } from "@/lib/db/types";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const categories = await query<ProductCategory>(
      "SELECT * FROM product_categories WHERE id = $1",
      [id]
    );

    if (categories.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(categories[0]);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PATCH /api/categories/[id] - Update category (Admin only)
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    // Check if category exists
    const existing = await query<ProductCategory>(
      "SELECT id FROM product_categories WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if updating slug
    if (data.slug) {
      const slugExists = await query<ProductCategory>(
        "SELECT id FROM product_categories WHERE slug = $1 AND id != $2",
        [data.slug, id]
      );

      if (slugExists.length > 0) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(data.slug);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(data.sort_order);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(id);

    const result = await query<ProductCategory>(
      `UPDATE product_categories SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
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
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category (Admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    // Check if category exists
    const existing = await query<ProductCategory>(
      "SELECT id FROM product_categories WHERE id = $1",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if any products use this category
    const productsUsingCategory = await query<{ count: number }>(
      "SELECT COUNT(*) as count FROM products WHERE category_id = $1",
      [id]
    );

    if (productsUsingCategory[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that has products. Remove products from this category first." },
        { status: 400 }
      );
    }

    await execute("DELETE FROM product_categories WHERE id = $1", [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
