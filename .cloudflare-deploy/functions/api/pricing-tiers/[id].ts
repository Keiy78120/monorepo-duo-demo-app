/**
 * Pricing Tier by ID API
 * GET /api/pricing-tiers/:id - Get single pricing tier
 * PUT /api/pricing-tiers/:id - Update pricing tier (admin only)
 * DELETE /api/pricing-tiers/:id - Delete pricing tier (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { PricingTierRow, PricingTier } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function rowToTier(row: PricingTierRow): PricingTier {
  return {
    ...row,
    is_custom_price: intToBool(row.is_custom_price),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env, params } = context;
  const { id } = params;

  try {
    const tier = await queryOne<PricingTierRow>(
      env.DB,
      'SELECT * FROM pricing_tiers WHERE id = ?',
      [id]
    );

    if (!tier) {
      return new Response(JSON.stringify({ error: 'Pricing tier not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToTier(tier)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching pricing tier:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch pricing tier' }), {
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

    const existing = await queryOne<PricingTierRow>(
      env.DB,
      'SELECT * FROM pricing_tiers WHERE id = ?',
      [id]
    );

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Pricing tier not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Partial<PricingTier>;

    // Check uniqueness of quantity_grams if changing
    if (body.quantity_grams !== undefined && body.quantity_grams !== existing.quantity_grams) {
      const duplicate = await queryOne<{ id: string }>(
        env.DB,
        'SELECT id FROM pricing_tiers WHERE product_id = ? AND quantity_grams = ? AND id != ?',
        [existing.product_id, body.quantity_grams, id]
      );
      if (duplicate) {
        return new Response(JSON.stringify({ error: 'Pricing tier for this quantity already exists' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await execute(
      env.DB,
      `UPDATE pricing_tiers SET
        quantity_grams = ?, price = ?, is_custom_price = ?, sort_order = ?
      WHERE id = ?`,
      [
        body.quantity_grams ?? existing.quantity_grams,
        body.price ?? existing.price,
        body.is_custom_price !== undefined ? (body.is_custom_price ? 1 : 0) : existing.is_custom_price,
        body.sort_order ?? existing.sort_order,
        id,
      ]
    );

    const updated = await queryOne<PricingTierRow>(
      env.DB,
      'SELECT * FROM pricing_tiers WHERE id = ?',
      [id]
    );

    return new Response(JSON.stringify(rowToTier(updated!)), {
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
    console.error('Error updating pricing tier:', error);
    return new Response(JSON.stringify({ error: 'Failed to update pricing tier' }), {
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
      'SELECT id FROM pricing_tiers WHERE id = ?',
      [id]
    );

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Pricing tier not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'DELETE FROM pricing_tiers WHERE id = ?', [id]);

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
    console.error('Error deleting pricing tier:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete pricing tier' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
