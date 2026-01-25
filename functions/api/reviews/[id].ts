/**
 * Review by ID API
 * GET /api/reviews/:id - Get single review
 * PUT /api/reviews/:id - Update review status (admin only)
 * DELETE /api/reviews/:id - Delete review (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { queryOne, execute } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import type { Review, ReviewStatus } from '../../../src/lib/types';

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env, params } = context;
  const { id } = params;

  try {
    const review = await queryOne<Review>(env.DB, 'SELECT * FROM reviews WHERE id = ?', [id]);

    if (!review) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(review), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch review' }), {
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

    const existing = await queryOne<Review>(env.DB, 'SELECT * FROM reviews WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as { status: ReviewStatus };

    // Validate status
    const validStatuses: ReviewStatus[] = ['pending', 'published', 'rejected'];
    if (!validStatuses.includes(body.status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'UPDATE reviews SET status = ? WHERE id = ?', [body.status, id]);

    const updated = await queryOne<Review>(env.DB, 'SELECT * FROM reviews WHERE id = ?', [id]);

    return new Response(JSON.stringify(updated), {
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
    console.error('Error updating review:', error);
    return new Response(JSON.stringify({ error: 'Failed to update review' }), {
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

    const existing = await queryOne<{ id: string }>(env.DB, 'SELECT id FROM reviews WHERE id = ?', [id]);

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Review not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await execute(env.DB, 'DELETE FROM reviews WHERE id = ?', [id]);

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
    console.error('Error deleting review:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete review' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
