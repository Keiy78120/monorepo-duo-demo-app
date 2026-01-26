/**
 * User Orders API
 * GET /api/orders/user - Get orders for current Telegram user
 */

import type { Env } from '../../../src/lib/db';
import { query, parseJSON, execute } from '../../../src/lib/db';
import { verifyTelegramInitData } from '../../../src/lib/telegram';
import type { OrderRow, Order, OrderItem } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

function rowToOrder(row: OrderRow): Order {
  return {
    ...row,
    items: parseJSON<OrderItem[]>(row.items, []),
  };
}

async function cleanupOldOrders(db: Env["DB"]) {
  await execute(
    db,
    "DELETE FROM orders WHERE datetime(created_at) <= datetime('now', '-1 day')"
  );
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    await cleanupOldOrders(env.DB);
    const initData = url.searchParams.get('initData');

    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let telegramUserId: string;
    const isDev = env.ENVIRONMENT === 'development';

    if (isDev) {
      telegramUserId = 'dev_user_123';
    } else if (env.TELEGRAM_BOT_TOKEN) {
      const parsed = await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
      if (!parsed || !parsed.user) {
        return new Response(JSON.stringify({ error: 'Invalid Telegram initData' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      telegramUserId = String(parsed.user.id);
    } else {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const orders = await query<OrderRow>(
      env.DB,
      `SELECT * FROM orders WHERE telegram_user_id = ? ORDER BY created_at DESC`,
      [telegramUserId]
    );

    return new Response(JSON.stringify({ orders: orders.map(rowToOrder) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
