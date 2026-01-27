/**
 * Admin Contacts API
 * GET /api/admin/contacts - List telegram contacts (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { query, execute } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { TelegramContactRow, TelegramContact } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToContact(row: TelegramContactRow): TelegramContact {
  return {
    ...row,
    is_premium: row.is_premium === 1,
    is_admin: row.is_admin === 1,
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const rows = await query<TelegramContactRow>(
      env.DB,
      'SELECT * FROM telegram_contacts ORDER BY last_seen_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const countResult = await query<{ count: number }>(
      env.DB,
      'SELECT COUNT(*) as count FROM telegram_contacts'
    );
    const total = countResult[0]?.count ?? 0;

    return new Response(JSON.stringify({
      contacts: rows.map(rowToContact),
      total,
      limit,
      offset,
    }), {
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
    console.error('Error fetching contacts:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contacts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Update contact admin status
export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const body = await request.json() as { telegram_user_id: number; is_admin: boolean };

    if (!body.telegram_user_id) {
      return new Response(JSON.stringify({ error: 'telegram_user_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(
      env.DB,
      'UPDATE telegram_contacts SET is_admin = ? WHERE telegram_user_id = ?',
      [body.is_admin ? 1 : 0, body.telegram_user_id]
    );

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
    console.error('Error updating contact:', error);
    return new Response(JSON.stringify({ error: 'Failed to update contact' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
