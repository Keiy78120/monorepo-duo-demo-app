/**
 * Category by ID API
 * GET /api/categories/:id - Get single category
 * PUT /api/categories/:id - Update category (admin only)
 * DELETE /api/categories/:id - Delete category (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, boolToInt, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { ProductCategoryRow, ProductCategory } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function rowToCategory(row: ProductCategoryRow): ProductCategory {
  return {
    ...row,
    is_active: intToBool(row.is_active),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env, params } = context;
  const { id } = params;

  try {
    // Try by ID first, then by slug
    let category = await queryOne<ProductCategoryRow>(
      env.DB,
      'SELECT * FROM product_categories WHERE id = ?',
      [id]
    );

    if (!category) {
      category = await queryOne<ProductCategoryRow>(
        env.DB,
        'SELECT * FROM product_categories WHERE slug = ?',
        [id]
      );
    }

    if (!category) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToCategory(category)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch category' }), {
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

    const existing = await queryOne<ProductCategoryRow>(
      env.DB,
      'SELECT * FROM product_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Partial<ProductCategory>;

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      if (!/^[a-z0-9-]+$/.test(body.slug)) {
        return new Response(JSON.stringify({ error: 'Slug must be lowercase alphanumeric with hyphens only' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const slugExists = await queryOne<{ id: string }>(
        env.DB,
        'SELECT id FROM product_categories WHERE slug = ? AND id != ?',
        [body.slug, id]
      );
      if (slugExists) {
        return new Response(JSON.stringify({ error: 'Slug already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await execute(
      env.DB,
      `UPDATE product_categories SET
        name = ?, slug = ?, description = ?, sort_order = ?, is_active = ?
      WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.slug ?? existing.slug,
        body.description ?? existing.description,
        body.sort_order ?? existing.sort_order,
        body.is_active !== undefined ? boolToInt(body.is_active) : existing.is_active,
        id,
      ]
    );

    const updated = await queryOne<ProductCategoryRow>(
      env.DB,
      'SELECT * FROM product_categories WHERE id = ?',
      [id]
    );

    return new Response(JSON.stringify(rowToCategory(updated!)), {
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
    console.error('Error updating category:', error);
    return new Response(JSON.stringify({ error: 'Failed to update category' }), {
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

    const existing = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM product_categories WHERE id = ?',
      [id]
    );

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'DELETE FROM product_categories WHERE id = ?', [id]);

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
    console.error('Error deleting category:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete category' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
