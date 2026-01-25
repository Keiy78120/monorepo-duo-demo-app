/**
 * Products API
 * GET /api/products - List products (public)
 * POST /api/products - Create product (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, generateUUID, nowISO, boolToInt, intToBool, parseJSON } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { ProductRow, Product } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
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
  const { env } = context;
  const url = new URL(context.request.url);

  const category = url.searchParams.get('category');
  const categoryId = url.searchParams.get('category_id');
  const activeParam = url.searchParams.get('active');

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: unknown[] = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (categoryId) {
    sql += ' AND category_id = ?';
    params.push(categoryId);
  }

  if (activeParam !== null) {
    const isActive = activeParam === 'true' ? 1 : 0;
    sql += ' AND is_active = ?';
    params.push(isActive);
  }

  sql += ' ORDER BY updated_at DESC';

  try {
    const rows = await query<ProductRow>(env.DB, sql, params);
    const products = rows.map(rowToProduct);

    return new Response(JSON.stringify(products), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    // Require admin
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as Partial<Product>;

    // Validate required fields
    if (!body.name || !body.slug) {
      return new Response(JSON.stringify({ error: 'Name and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check slug uniqueness
    const existing = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM products WHERE slug = ?',
      [body.slug]
    );

    if (existing) {
      return new Response(JSON.stringify({ error: 'Slug already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateUUID();
    const now = nowISO();

    await execute(
      env.DB,
      `INSERT INTO products (
        id, name, slug, description, price, currency, images, category, tags,
        farm_label, origin_flag, is_active, created_at, updated_at,
        category_id, variety, cost_price_per_gram, margin_percentage, stock_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.slug,
        body.description ?? null,
        body.price ?? 0,
        body.currency ?? 'EUR',
        JSON.stringify(body.images ?? []),
        body.category ?? null,
        JSON.stringify(body.tags ?? []),
        body.farm_label ?? null,
        body.origin_flag ?? null,
        boolToInt(body.is_active ?? true),
        now,
        now,
        body.category_id ?? null,
        body.variety ?? null,
        body.cost_price_per_gram ?? 0,
        body.margin_percentage ?? 50,
        body.stock_quantity ?? null,
      ]
    );

    const product = await queryOne<ProductRow>(env.DB, 'SELECT * FROM products WHERE id = ?', [id]);

    return new Response(JSON.stringify(rowToProduct(product!)), {
      status: 201,
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
    console.error('Error creating product:', error);
    return new Response(JSON.stringify({ error: 'Failed to create product' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
