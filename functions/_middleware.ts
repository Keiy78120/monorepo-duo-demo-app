/**
 * Global Middleware for API Functions
 * Handles CORS, error handling, and request logging
 */

interface PagesContext {
  request: Request;
  env: Record<string, unknown>;
  next: () => Promise<Response>;
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://vhash.pages.dev',
  'https://vhash-cloudflare-app.pages.dev',
  'http://localhost:3000',
  'http://localhost:8788',
  // Add your Telegram Mini App domain here
];

function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers();

  // Check if origin is allowed
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o =>
    origin === o || origin.endsWith('.pages.dev') || origin.includes('localhost')
  ) ? origin : ALLOWED_ORIGINS[0];

  headers.set('Access-Control-Allow-Origin', allowedOrigin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-User-Id, X-Telegram-Init-Data');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');

  return headers;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request } = context;
  const origin = request.headers.get('Origin');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  try {
    // Continue to the next handler
    const response = await context.next();

    // Clone response to add CORS headers
    const newHeaders = new Headers(response.headers);
    const corsHeaders = getCorsHeaders(origin);
    corsHeaders.forEach((value, key) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('Middleware error:', error);

    const errorResponse = new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(getCorsHeaders(origin)),
        },
      }
    );

    return errorResponse;
  }
}
