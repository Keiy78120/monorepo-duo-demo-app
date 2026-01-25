/**
 * Product by ID API
 * GET /api/products/:id - Get single product
 * PUT /api/products/:id - Update product (admin only)
 * DELETE /api/products/:id - Delete product (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, nowISO, boolToInt, intToBool, parseJSON } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { ProductRow, Product } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function rowToProduct(row: ProductRow): Product {
  return {
    ...row,
    images: parseJSON<string[]>(row.images, []),
    tags: parseJSON<string[]>(row.tags, []),
    is_active: intToBool(row.is_active),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env, params } = context;
  const { id } = params;

  try {
    // Try by ID first, then by slug
    let product = await queryOne<ProductRow>(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      product = await queryOne<ProductRow>(env.DB, 'SELECT * FROM products WHERE slug = ?', [id]);
    }

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToProduct(product)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const existing = await queryOne<ProductRow>(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Partial<Product>;

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await queryOne<{ id: string }>(
        env.DB,
        'SELECT id FROM products WHERE slug = ? AND id != ?',
        [body.slug, id]
      );
      if (slugExists) {
        return new Response(JSON.stringify({ error: 'Slug already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const now = nowISO();

    await execute(
      env.DB,
      `UPDATE products SET
        name = ?, slug = ?, description = ?, price = ?, currency = ?,
        images = ?, category = ?, tags = ?, farm_label = ?, origin_flag = ?,
        is_active = ?, updated_at = ?, category_id = ?, variety = ?,
        cost_price_per_gram = ?, margin_percentage = ?, stock_quantity = ?
      WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.slug ?? existing.slug,
        body.description ?? existing.description,
        body.price ?? existing.price,
        body.currency ?? existing.currency,
        body.images ? JSON.stringify(body.images) : existing.images,
        body.category ?? existing.category,
        body.tags ? JSON.stringify(body.tags) : existing.tags,
        body.farm_label ?? existing.farm_label,
        body.origin_flag ?? existing.origin_flag,
        body.is_active !== undefined ? boolToInt(body.is_active) : existing.is_active,
        now,
        body.category_id ?? existing.category_id,
        body.variety ?? existing.variety,
        body.cost_price_per_gram ?? existing.cost_price_per_gram,
        body.margin_percentage ?? existing.margin_percentage,
        body.stock_quantity ?? existing.stock_quantity,
        id,
      ]
    );

    const updated = await queryOne<ProductRow>(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);

    return new Response(JSON.stringify(rowToProduct(updated!)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Error updating product:', error);
    return new Response(JSON.stringify({ error: 'Failed to update product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const existing = await queryOne<{ id: string }>(env.DB, 'SELECT id FROM products WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'DELETE FROM products WHERE id = ?', [id]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error instanceof Error && error.message.includes('Admin')) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('Error deleting product:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
