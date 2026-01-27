/**
 * Driver by ID API
 * GET /api/drivers/:id - Get single driver
 * PUT /api/drivers/:id - Update driver (admin only)
 * DELETE /api/drivers/:id - Delete driver (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, nowISO, boolToInt, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { DriverRow, Driver } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function rowToDriver(row: DriverRow): Driver {
  return {
    ...row,
    is_active: intToBool(row.is_active),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const driver = await queryOne<DriverRow>(env.DB, 'SELECT * FROM drivers WHERE id = ?', [id]);

    if (!driver) {
      return new Response(JSON.stringify({ error: 'Driver not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToDriver(driver)), {
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
    console.error('Error fetching driver:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch driver' }), {
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

    const existing = await queryOne<DriverRow>(env.DB, 'SELECT * FROM drivers WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Driver not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Partial<Driver>;
    const now = nowISO();

    await execute(
      env.DB,
      `UPDATE drivers SET name = ?, phone = ?, is_active = ?, updated_at = ? WHERE id = ?`,
      [
        body.name ?? existing.name,
        body.phone ?? existing.phone,
        body.is_active !== undefined ? boolToInt(body.is_active) : existing.is_active,
        now,
        id,
      ]
    );

    const updated = await queryOne<DriverRow>(env.DB, 'SELECT * FROM drivers WHERE id = ?', [id]);

    return new Response(JSON.stringify(rowToDriver(updated!)), {
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
    console.error('Error updating driver:', error);
    return new Response(JSON.stringify({ error: 'Failed to update driver' }), {
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

    const existing = await queryOne<{ id: string }>(env.DB, 'SELECT id FROM drivers WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Driver not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set orders with this driver to null
    await execute(env.DB, 'UPDATE orders SET driver_id = NULL WHERE driver_id = ?', [id]);

    await execute(env.DB, 'DELETE FROM drivers WHERE id = ?', [id]);

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
    console.error('Error deleting driver:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete driver' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
