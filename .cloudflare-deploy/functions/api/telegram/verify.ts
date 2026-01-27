/**
 * Telegram Verification API
 * POST /api/telegram/verify - Verify Telegram initData and log user
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, generateUUID, nowISO } from '../../../src/lib/db';
import { verifyTelegramInitData, type TelegramUser } from '../../../src/lib/telegram';
import { isAdmin, signAdminToken, createAdminCookie } from '../../../src/lib/auth';
import type { TelegramContactRow } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as { initData: string };

    if (!body.initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify Telegram initData
    if (!env.TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parsed = await verifyTelegramInitData(body.initData, env.TELEGRAM_BOT_TOKEN);

    if (!parsed) {
      return new Response(JSON.stringify({ error: 'Invalid initData' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!parsed.user) {
      return new Response(JSON.stringify({ error: 'No user in initData' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = parsed.user;
    const now = nowISO();

    // Upsert telegram contact
    const existing = await queryOne<TelegramContactRow>(
      env.DB,
      'SELECT * FROM telegram_contacts WHERE telegram_user_id = ?',
      [user.id]
    );

    if (existing) {
      await execute(
        env.DB,
        `UPDATE telegram_contacts SET
          username = ?,
          first_name = ?,
          last_name = ?,
          language_code = ?,
          is_premium = ?,
          last_seen_at = ?,
          visits_count = visits_count + 1
        WHERE telegram_user_id = ?`,
        [
          user.username ?? null,
          user.first_name ?? null,
          user.last_name ?? null,
          user.language_code ?? null,
          user.is_premium ? 1 : 0,
          now,
          user.id,
        ]
      );
    } else {
      await execute(
        env.DB,
        `INSERT INTO telegram_contacts (
          id, telegram_user_id, username, first_name, last_name, language_code,
          is_premium, is_admin, first_seen_at, last_seen_at, visits_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateUUID(),
          user.id,
          user.username ?? null,
          user.first_name ?? null,
          user.last_name ?? null,
          user.language_code ?? null,
          user.is_premium ? 1 : 0,
          0, // is_admin defaults to false
          now,
          now,
          1,
        ]
      );
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(env.DB, String(user.id), env.ADMIN_TELEGRAM_IDS);

    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Set admin cookie if admin
    if (userIsAdmin) {
      const token = await signAdminToken(
        {
          sub: String(user.id),
          username: user.username,
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        },
        env.ADMIN_SESSION_SECRET
      );
      headers.set('Set-Cookie', createAdminCookie(token));
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          language_code: user.language_code,
          is_premium: user.is_premium,
          is_admin: userIsAdmin,
        },
        queryId: parsed.query_id,
        authDate: parsed.auth_date,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Error verifying Telegram initData:', error);
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
