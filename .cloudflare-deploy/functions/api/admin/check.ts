/**
 * Admin Check API
 * GET /api/admin/check - Check if current user is admin (from session)
 * POST /api/admin/check - Check if a specific telegram_user_id is admin
 */

import type { Env } from '../../../src/lib/db';
import { getSession, isAdmin } from '../../../src/lib/auth';

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

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as { telegram_user_id?: string };

    if (!body.telegram_user_id) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adminStatus = await isAdmin(env.DB, body.telegram_user_id, env.ADMIN_TELEGRAM_IDS);

    if (!adminStatus) {
      return new Response(JSON.stringify({ error: 'Unauthorized', isAdmin: false }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ isAdmin: true }), {
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
