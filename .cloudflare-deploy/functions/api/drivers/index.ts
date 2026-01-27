/**
 * Drivers API
 * GET /api/drivers - List drivers (admin only)
 * POST /api/drivers - Create driver (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, execute, generateUUID, nowISO, intToBool } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { DriverRow, Driver } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToDriver(row: DriverRow): Driver {
  return {
    ...row,
    is_active: intToBool(row.is_active),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const activeParam = url.searchParams.get('active');
    const showActiveOnly = activeParam === 'true';

    let sql = 'SELECT * FROM drivers';
    const params: unknown[] = [];

    if (showActiveOnly) {
      sql += ' WHERE is_active = 1';
    }

    sql += ' ORDER BY name ASC';

    const rows = await query<DriverRow>(env.DB, sql, params);

    return new Response(JSON.stringify({ drivers: rows.map(rowToDriver) }), {
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
    console.error('Error fetching drivers:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch drivers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as Partial<Driver>;

    // Validate required fields
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateUUID();
    const now = nowISO();

    await execute(
      env.DB,
      `INSERT INTO drivers (id, name, phone, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.phone ?? null,
        body.is_active !== false ? 1 : 0,
        now,
        now,
      ]
    );

    const driver = await query<DriverRow>(env.DB, 'SELECT * FROM drivers WHERE id = ?', [id]);

    return new Response(JSON.stringify({ driver: rowToDriver(driver[0]) }), {
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
    console.error('Error creating driver:', error);
    return new Response(JSON.stringify({ error: 'Failed to create driver' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
