/**
 * Test R2 binding
 */
import type { Env } from '../src/lib/db';

interface PagesContext {
  request: Request;
  env: Env;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { env } = context;

  try {
    // Test if MEDIA binding exists
    if (!env.MEDIA) {
      return new Response(JSON.stringify({
        error: 'MEDIA binding not found',
        available_bindings: Object.keys(env),
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Try to get a file
    const file = await env.MEDIA.get('products/leafly/blue-dream.jpg');

    return new Response(JSON.stringify({
      success: true,
      file_found: !!file,
      file_size: file?.size || 0,
      etag: file?.etag || null,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
