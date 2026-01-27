/**
 * Settings API
 * GET /api/settings - Get all settings (public, some filtered)
 * GET /api/settings?key=xxx - Get specific setting
 * PUT /api/settings - Update setting (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, nowISO, parseJSON } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { SettingRow, Setting } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToSetting(row: SettingRow): Setting {
  return {
    key: row.key,
    value: parseJSON(row.value, row.value),
    description: row.description,
    updated_at: row.updated_at,
  };
}

// Settings that are public (no auth required)
const PUBLIC_SETTINGS = [
  'general',
  'info',
  'order_warning_message',
  'delivery_start_time',
  'min_order_amount',
];

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env } = context;
  const url = new URL(context.request.url);

  const key = url.searchParams.get('key');

  try {
    if (key) {
      // Get specific setting
      const setting = await queryOne<SettingRow>(
        env.DB,
        'SELECT * FROM settings WHERE key = ?',
        [key]
      );

      if (!setting) {
        return new Response(JSON.stringify({ error: 'Setting not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(rowToSetting(setting)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all public settings
    const placeholders = PUBLIC_SETTINGS.map(() => '?').join(',');
    const rows = await query<SettingRow>(
      env.DB,
      `SELECT * FROM settings WHERE key IN (${placeholders})`,
      PUBLIC_SETTINGS
    );

    // Convert to object format
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      settings[row.key] = parseJSON(row.value, row.value);
    }

    return new Response(JSON.stringify(settings), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as { key: string; value: unknown; description?: string };

    if (!body.key) {
      return new Response(JSON.stringify({ error: 'Key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = nowISO();
    const valueString = JSON.stringify(body.value);

    // Upsert the setting
    const existing = await queryOne<{ key: string }>(
      env.DB,
      'SELECT key FROM settings WHERE key = ?',
      [body.key]
    );

    if (existing) {
      await execute(
        env.DB,
        `UPDATE settings SET value = ?, description = COALESCE(?, description), updated_at = ? WHERE key = ?`,
        [valueString, body.description ?? null, now, body.key]
      );
    } else {
      await execute(
        env.DB,
        `INSERT INTO settings (key, value, description, updated_at) VALUES (?, ?, ?, ?)`,
        [body.key, valueString, body.description ?? null, now]
      );
    }

    const setting = await queryOne<SettingRow>(
      env.DB,
      'SELECT * FROM settings WHERE key = ?',
      [body.key]
    );

    return new Response(JSON.stringify(rowToSetting(setting!)), {
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
    console.error('Error updating setting:', error);
    return new Response(JSON.stringify({ error: 'Failed to update setting' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
