import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, execute } from "@/lib/db/client";
import { getSession } from "@/lib/auth/guard";
import { z } from "zod";
import { isMaintenanceMode } from "@/lib/maintenance";
import type { Product } from "@/lib/db/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/products/[id] - Get single product
export async function GET(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;

    const product = await queryOne<Product>(
      `SELECT * FROM products WHERE id = $1`,
      [id]
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// Update product schema - with cannabis pricing fields
const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  variety: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  currency: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  stock_quantity: z.number().int().min(0).optional().nullable(),
  tags: z.array(z.string()).optional(),
  farm_label: z.string().optional().nullable(),
  origin_flag: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
  // Cannabis pricing fields
  cost_price_per_gram: z.number().int().min(0).optional(),
  margin_percentage: z.number().int().min(0).max(1000).optional(),
});

// PATCH /api/products/[id] - Update product (admin only)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if product exists
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM products WHERE id = $1`,
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If updating slug, check for conflicts
    if (parsed.data.slug) {
      const slugConflict = await queryOne<{ id: string }>(
        `SELECT id FROM products WHERE slug = $1 AND id != $2`,
        [parsed.data.slug, id]
      );

      if (slugConflict) {
        return NextResponse.json(
          { error: "A product with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const data = parsed.data;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(data.slug);
    }
    if (data.variety !== undefined) {
      updates.push(`variety = $${paramIndex++}`);
      values.push(data.variety);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(data.currency);
    }
    if (data.images !== undefined) {
      updates.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(data.images));
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.category_id !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(data.category_id);
    }
    if (data.stock_quantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      values.push(data.stock_quantity);
    }
    if (data.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`);
      values.push(data.tags);
    }
    if (data.farm_label !== undefined) {
      updates.push(`farm_label = $${paramIndex++}`);
      values.push(data.farm_label);
    }
    if (data.origin_flag !== undefined) {
      updates.push(`origin_flag = $${paramIndex++}`);
      values.push(data.origin_flag);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    // Cannabis pricing fields
    if (data.cost_price_per_gram !== undefined) {
      updates.push(`cost_price_per_gram = $${paramIndex++}`);
      values.push(data.cost_price_per_gram);
    }
    if (data.margin_percentage !== undefined) {
      updates.push(`margin_percentage = $${paramIndex++}`);
      values.push(data.margin_percentage);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    const product = await queryOne<Product>(
      `UPDATE products SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const rowCount = await execute(`DELETE FROM products WHERE id = $1`, [id]);

    if (rowCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
