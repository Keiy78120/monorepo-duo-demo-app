/**
 * Orders API
 * GET /api/orders - List orders (admin only)
 * POST /api/orders - Create order (public with Telegram verification)
 */

import type { Env } from '../../../src/lib/db';
import { query, queryOne, execute, generateUUID, nowISO, parseJSON } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import { verifyTelegramInitData } from '../../../src/lib/telegram';
import type { OrderRow, Order, OrderItem, ProductRow } from '../../../src/lib/types';

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

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date'); // YYYY-MM-DD
    const driverId = url.searchParams.get('driver_id');

    let sql = `
      SELECT o.*, d.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (date) {
      sql += ' AND o.order_day = ?';
      params.push(date);
    }

    if (driverId) {
      sql += ' AND o.driver_id = ?';
      params.push(driverId);
    }

    sql += ' ORDER BY o.created_at DESC';

    const rows = await query<OrderRow & { driver_name: string | null }>(env.DB, sql, params);

    // Also fetch drivers for the response
    const drivers = await query<{ id: string; name: string }>(
      env.DB,
      'SELECT id, name FROM drivers WHERE is_active = 1 ORDER BY name'
    );

    return new Response(JSON.stringify({
      orders: rows.map(rowToOrder),
      drivers,
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
    console.error('Error fetching orders:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    const body = await request.json() as {
      items: OrderItem[];
      total: number;
      currency?: string;
      notes?: string;
      delivery_address?: string;
      initData?: string;
    };

    // Validate items
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items are required' }), {
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

    // Validate all products exist and are active
    const productIds = body.items.map(item => item.product_id);
    const products = await query<ProductRow>(
      env.DB,
      `SELECT id, name, is_active FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    if (products.length !== productIds.length) {
      return new Response(JSON.stringify({ error: 'One or more products not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const inactiveProducts = products.filter(p => p.is_active === 0);
    if (inactiveProducts.length > 0) {
      return new Response(JSON.stringify({ error: 'One or more products are not available' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate total and verify
    const calculatedTotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (Math.abs(calculatedTotal - body.total) > 1) { // Allow 1 cent tolerance for rounding
      return new Response(JSON.stringify({
        error: 'Total mismatch',
        expected: calculatedTotal,
        received: body.total,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get next daily order number
    const today = new Date().toISOString().split('T')[0];
    const lastOrder = await queryOne<{ daily_order_number: number }>(
      env.DB,
      'SELECT daily_order_number FROM orders WHERE order_day = ? ORDER BY daily_order_number DESC LIMIT 1',
      [today]
    );
    const dailyOrderNumber = (lastOrder?.daily_order_number ?? 0) + 1;

    const id = generateUUID();
    const now = nowISO();

    await execute(
      env.DB,
      `INSERT INTO orders (
        id, telegram_user_id, username, items, total, currency, status,
        notes, created_at, updated_at, order_day, daily_order_number, delivery_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        telegramUserId,
        username,
        JSON.stringify(body.items),
        body.total,
        body.currency ?? 'EUR',
        'pending',
        body.notes ?? null,
        now,
        now,
        today,
        dailyOrderNumber,
        body.delivery_address ?? null,
      ]
    );

    const order = await queryOne<OrderRow>(env.DB, 'SELECT * FROM orders WHERE id = ?', [id]);

    return new Response(JSON.stringify({ order: rowToOrder(order!) }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({ error: 'Failed to create order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
