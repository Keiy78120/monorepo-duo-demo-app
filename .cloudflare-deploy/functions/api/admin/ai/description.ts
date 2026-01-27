/**
 * AI Description Generation API
 * POST /api/admin/ai/description - Generate product description (admin only)
 */

import type { Env } from '../../../../src/lib/db';
import { requireAdmin } from '../../../../src/lib/auth';
import { generateDescription } from '../../../../src/lib/groq';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

interface RequestBody {
  strain_name: string;
  existing_description?: string | null;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    // Require admin
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    // Check for Groq API key
    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'GROQ_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json() as RequestBody;

    // Validate input
    if (!body.strain_name || typeof body.strain_name !== 'string' || body.strain_name.length < 1) {
      return new Response(JSON.stringify({ error: 'strain_name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.strain_name.length > 120) {
      return new Response(JSON.stringify({ error: 'strain_name too long (max 120)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await generateDescription(
      body.strain_name,
      env.GROQ_API_KEY,
      env.GROQ_MODEL,
      body.existing_description
    );

    return new Response(JSON.stringify({
      description: result.description,
      source: result.source,
      strain: { name: body.strain_name },
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
    console.error('AI description error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate description' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
