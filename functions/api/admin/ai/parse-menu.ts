/**
 * AI Menu Parsing API
 * POST /api/admin/ai/parse-menu - Parse menu text to extract products (admin only)
 */

import type { Env } from '../../../../src/lib/db';
import { requireAdmin } from '../../../../src/lib/auth';
import { parseMenu, type ParseMenuResult } from '../../../../src/lib/groq';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

interface RequestBody {
  menu_text: string;
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
    if (!body.menu_text || typeof body.menu_text !== 'string') {
      return new Response(JSON.stringify({ error: 'menu_text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.menu_text.length < 10) {
      return new Response(JSON.stringify({ error: 'Le texte du menu est trop court' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.menu_text.length > 50000) {
      return new Response(JSON.stringify({ error: 'Le texte du menu est trop long (max 50000)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await parseMenu(
      body.menu_text,
      env.GROQ_API_KEY,
      env.GROQ_MODEL
    );

    const warnings: string[] = result.warnings || [];

    if (result.products.length === 0) {
      warnings.push('Aucun produit détecté dans le texte fourni');
    }

    return new Response(JSON.stringify({
      products: result.products,
      warnings: warnings.length > 0 ? warnings : undefined,
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
    console.error('AI parse-menu error:', error);
    return new Response(JSON.stringify({
      error: 'Échec de l\'analyse IA. Réessayez ou vérifiez le format du menu.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
