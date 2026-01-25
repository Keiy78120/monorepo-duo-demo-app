/**
 * Reviews API
 * GET /api/reviews - List reviews (public)
 * POST /api/reviews - Create review (public with Telegram verification)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, generateUUID, nowISO } from '../../../src/lib/db';
import { verifyTelegramInitData } from '../../../src/lib/telegram';
import type { Review, ReviewStatus } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env } = context;
  const url = new URL(context.request.url);

  const status = url.searchParams.get('status') || 'published';
  const productId = url.searchParams.get('product_id');

  let sql = 'SELECT * FROM reviews WHERE status = ?';
  const params: unknown[] = [status];

  if (productId) {
    sql += ' AND product_id = ?';
    params.push(productId);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const reviews = await query<Review>(env.DB, sql, params);

    return new Response(JSON.stringify({ reviews }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      product_id?: string;
      rating: number;
      content: string;
      initData?: string;
    };

    // Validate rating
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate content
    if (!body.content || body.content.length < 10 || body.content.length > 1000) {
      return new Response(JSON.stringify({ error: 'Content must be between 10 and 1000 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify Telegram user
    let telegramUserId = 'anonymous';
    let username: string | null = null;

    const isDev = env.ENVIRONMENT === 'development';

    if (isDev) {
      telegramUserId = 'dev_user_123';
      username = 'dev_user';
    } else if (body.initData && env.TELEGRAM_BOT_TOKEN) {
      const parsed = await verifyTelegramInitData(body.initData, env.TELEGRAM_BOT_TOKEN);
      if (!parsed || !parsed.user) {
        return new Response(JSON.stringify({ error: 'Invalid Telegram initData' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      telegramUserId = String(parsed.user.id);
      username = parsed.user.username || null;
    }

    // Validate product exists if provided
    if (body.product_id) {
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
    }

    const id = generateUUID();
    const now = nowISO();

    await execute(
      env.DB,
      `INSERT INTO reviews (id, product_id, telegram_user_id, username, rating, content, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.product_id ?? null,
        telegramUserId,
        username,
        body.rating,
        body.content,
        'pending' as ReviewStatus,
        now,
      ]
    );

    const review = await queryOne<Review>(env.DB, 'SELECT * FROM reviews WHERE id = ?', [id]);

    return new Response(JSON.stringify({ review }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return new Response(JSON.stringify({ error: 'Failed to create review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
