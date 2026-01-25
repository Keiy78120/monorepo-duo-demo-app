/**
 * Admin Session API
 * GET /api/admin/session - Get current session info
 * DELETE /api/admin/session - Logout admin
 */

import type { Env } from '../../../src/lib/db';
import { getSession, clearAdminCookie } from '../../../src/lib/auth';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    const session = await getSession(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    if (!session) {
      return new Response(JSON.stringify({
        user: null,
        isAdmin: false,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      user: {
        id: session.telegramUserId,
        telegram_user_id: session.telegramUserId,
        username: session.username,
      },
      isAdmin: session.isAdmin,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return new Response(JSON.stringify({ error: 'Failed to get session' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': clearAdminCookie(),
  });

  return new Response(JSON.stringify({ success: true }), { headers });
}
