/**
 * Order by ID API
 * GET /api/orders/:id - Get single order
 * PUT /api/orders/:id - Update order (admin only)
 * DELETE /api/orders/:id - Delete order (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute, nowISO, parseJSON } from '../../../src/lib/db';
import { requireAdmin, getSession } from '../../../src/lib/auth';
import type { OrderRow, Order, OrderItem, OrderStatus } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function rowToOrder(row: OrderRow): Order {
  return {
    ...row,
    items: parseJSON<OrderItem[]>(row.items, []),
  };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    const session = await getSession(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const order = await queryOne<OrderRow & { driver_name: string | null }>(
      env.DB,
      `SELECT o.*, d.name as driver_name
       FROM orders o
       LEFT JOIN drivers d ON o.driver_id = d.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Non-admins can only see their own orders
    if (!session?.isAdmin && session?.telegramUserId !== order.telegram_user_id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rowToOrder(order)), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const existing = await queryOne<OrderRow>(env.DB, 'SELECT * FROM orders WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as Partial<{
      status: OrderStatus;
      notes: string;
      delivery_address: string;
      driver_id: string | null;
    }>;

    const now = nowISO();

    await execute(
      env.DB,
      `UPDATE orders SET
        status = ?, notes = ?, delivery_address = ?, driver_id = ?, updated_at = ?
      WHERE id = ?`,
      [
        body.status ?? existing.status,
        body.notes ?? existing.notes,
        body.delivery_address ?? existing.delivery_address,
        body.driver_id !== undefined ? body.driver_id : existing.driver_id,
        now,
        id,
      ]
    );

    const updated = await queryOne<OrderRow & { driver_name: string | null }>(
      env.DB,
      `SELECT o.*, d.name as driver_name
       FROM orders o
       LEFT JOIN drivers d ON o.driver_id = d.id
       WHERE o.id = ?`,
      [id]
    );

    return new Response(JSON.stringify(rowToOrder(updated!)), {
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
    console.error('Error updating order:', error);
    return new Response(JSON.stringify({ error: 'Failed to update order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const { id } = params;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const existing = await queryOne<{ id: string }>(env.DB, 'SELECT id FROM orders WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'DELETE FROM orders WHERE id = ?', [id]);

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
    console.error('Error deleting order:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
