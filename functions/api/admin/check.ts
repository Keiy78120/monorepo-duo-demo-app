/**
 * Admin Check API
 * GET /api/admin/check - Check if current user is admin
 */

import type { Env } from '../../../src/lib/db';
import { getSession } from '../../../src/lib/auth';

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
        isAuthenticated: false,
        isAdmin: false,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      isAuthenticated: true,
      isAdmin: session.isAdmin,
      telegramUserId: session.telegramUserId,
      username: session.username,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return new Response(JSON.stringify({ error: 'Failed to check admin status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
