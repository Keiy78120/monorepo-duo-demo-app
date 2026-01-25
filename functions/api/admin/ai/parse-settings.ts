/**
 * AI Settings Parsing API
 * POST /api/admin/ai/parse-settings - Parse settings text to extract store info (admin only)
 */

import type { Env } from '../../../../src/lib/db';
import { requireAdmin } from '../../../../src/lib/auth';
import { parseSettings, type ParseSettingsResult } from '../../../../src/lib/groq';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

interface RequestBody {
  text: string;
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
    if (!body.text || typeof body.text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.text.trim().length < 10) {
      return new Response(JSON.stringify({ error: 'Le texte est trop court' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.text.length > 10000) {
      return new Response(JSON.stringify({ error: 'Le texte est trop long (max 10000)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await parseSettings(
      body.text,
      env.GROQ_API_KEY,
      env.GROQ_MODEL
    );

    return new Response(JSON.stringify({
      settings: result.settings,
      warnings: result.warnings || [],
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
    console.error('AI parse-settings error:', error);
    return new Response(JSON.stringify({
      error: 'Échec de l\'analyse IA. Réessayez ou vérifiez le texte.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
