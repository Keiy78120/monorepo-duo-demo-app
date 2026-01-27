/**
 * Pricing Tiers API
 * GET /api/pricing-tiers - List pricing tiers (public)
 * POST /api/pricing-tiers - Create pricing tier (admin only)
 * PUT /api/pricing-tiers - Batch update pricing tiers for a product (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, batch, generateUUID, nowISO, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { PricingTierRow, PricingTier } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToTier(row: PricingTierRow): PricingTier {
  return {
    ...row,
    is_custom_price: intToBool(row.is_custom_price),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env } = context;
  const url = new URL(context.request.url);

  const productId = url.searchParams.get('product_id');

  let sql = 'SELECT * FROM pricing_tiers';
  const params: unknown[] = [];

  if (productId) {
    sql += ' WHERE product_id = ?';
    params.push(productId);
  }

  sql += ' ORDER BY sort_order ASC, quantity_grams ASC';

  try {
    const rows = await query<PricingTierRow>(env.DB, sql, params);
    const tiers = rows.map(rowToTier);

    return new Response(JSON.stringify(tiers), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pricing tiers:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pricing tiers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as Partial<PricingTier>;

    // Validate required fields
    if (!body.product_id || body.quantity_grams === undefined || body.price === undefined) {
      return new Response(JSON.stringify({ error: 'product_id, quantity_grams, and price are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check product exists
    const product = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM products WHERE id = ?',
      [body.product_id]
    );

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check uniqueness of quantity_grams for this product
    const existing = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM pricing_tiers WHERE product_id = ? AND quantity_grams = ?',
      [body.product_id, body.quantity_grams]
    );

    if (existing) {
      return new Response(JSON.stringify({ error: 'Pricing tier for this quantity already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateUUID();
    const now = nowISO();

    await execute(
      env.DB,
      `INSERT INTO pricing_tiers (id, product_id, quantity_grams, price, is_custom_price, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.product_id,
        body.quantity_grams,
        body.price,
        body.is_custom_price ? 1 : 0,
        body.sort_order ?? 0,
        now,
      ]
    );

    const tier = await queryOne<PricingTierRow>(
      env.DB,
      'SELECT * FROM pricing_tiers WHERE id = ?',
      [id]
    );

    return new Response(JSON.stringify(rowToTier(tier!)), {
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
    console.error('Error creating pricing tier:', error);
    return new Response(JSON.stringify({ error: 'Failed to create pricing tier' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Batch update pricing tiers for a product
export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as {
      product_id: string;
      tiers: Array<{
        quantity_grams: number;
        price: number;
        is_custom_price?: boolean;
        sort_order?: number;
      }>;
    };

    if (!body.product_id || !Array.isArray(body.tiers)) {
      return new Response(JSON.stringify({ error: 'product_id and tiers array are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check product exists
    const product = await queryOne<{ id: string }>(
      env.DB,
      'SELECT id FROM products WHERE id = ?',
      [body.product_id]
    );

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = nowISO();

    // Delete existing tiers
    await execute(
      env.DB,
      'DELETE FROM pricing_tiers WHERE product_id = ?',
      [body.product_id]
    );

    // Insert new tiers
    const statements = body.tiers.map((tier, index) => ({
      sql: `INSERT INTO pricing_tiers (id, product_id, quantity_grams, price, is_custom_price, sort_order, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        generateUUID(),
        body.product_id,
        tier.quantity_grams,
        tier.price,
        tier.is_custom_price ? 1 : 0,
        tier.sort_order ?? index,
        now,
      ],
    }));

    if (statements.length > 0) {
      await batch(env.DB, statements);
    }

    // Fetch the created tiers
    const rows = await query<PricingTierRow>(
      env.DB,
      'SELECT * FROM pricing_tiers WHERE product_id = ? ORDER BY sort_order ASC, quantity_grams ASC',
      [body.product_id]
    );

    return new Response(JSON.stringify(rows.map(rowToTier)), {
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
    console.error('Error batch updating pricing tiers:', error);
    return new Response(JSON.stringify({ error: 'Failed to update pricing tiers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
