/**
 * Categories API
 * GET /api/categories - List categories (public)
 * POST /api/categories - Create category (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, generateUUID, nowISO, boolToInt, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { ProductCategoryRow, ProductCategory } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToCategory(row: ProductCategoryRow): ProductCategory {
  return {
    ...row,
    is_active: intToBool(row.is_active),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env } = context;
  const url = new URL(context.request.url);

  const activeParam = url.searchParams.get('active');
  const showActive = activeParam !== 'false'; // Default to true

  let sql = 'SELECT * FROM product_categories';
  const params: unknown[] = [];

  if (showActive) {
    sql += ' WHERE is_active = 1';
  }

  sql += ' ORDER BY sort_order ASC, name ASC';

  try {
    const rows = await query<ProductCategoryRow>(env.DB, sql, params);
    const categories = rows.map(rowToCategory);

    return new Response(JSON.stringify(categories), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch categories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as Partial<ProductCategory>;

    // Validate required fields
    if (!body.name || !body.slug) {
      return new Response(JSON.stringify({ error: 'Name and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return new Response(JSON.stringify({ error: 'Slug must be lowercase alphanumeric with hyphens only' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check slug uniqueness
    const existing = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM product_categories WHERE slug = ?',
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
      `INSERT INTO product_categories (id, name, slug, description, sort_order, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.slug,
        body.description ?? null,
        body.sort_order ?? 0,
        boolToInt(body.is_active ?? true),
        now,
      ]
    );

    const category = await queryOne<ProductCategoryRow>(
      env.DB,
      'SELECT * FROM product_categories WHERE id = ?',
      [id]
    );

    return new Response(JSON.stringify(rowToCategory(category!)), {
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
    console.error('Error creating category:', error);
    return new Response(JSON.stringify({ error: 'Failed to create category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
