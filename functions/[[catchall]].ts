/**
 * Catch-all route for media files
 * Handles /product-media/* paths by serving from R2
 */

import type { Env } from '../src/lib/db';

interface PagesContext {
  request: Request;
  env: Env;
  params: {
    catchall?: string[];
  };
}

const CACHE_MAX_AGE = 86400;

const MIME_TYPES: Record<string, string> = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'webp': 'image/webp',
  'gif': 'image/gif',
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'm4v': 'video/mp4',
};

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only handle /product-media/* paths
  if (!pathname.startsWith('/product-media/')) {
    // Return null/undefined to let Pages handle it (show index.html)
    return new Response(null, { status: 404 });
  }

  try {
    // Remove leading slash to get R2 key
    const filePath = pathname.slice(1); // "product-media/..."

    // Get the file from R2
    const file = await env.MEDIA.get(filePath);

    if (!file) {
      console.log('File not found in R2:', filePath);
      return new Response('File not found', { status: 404 });
    }

    // Determine content type from extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Return the file
    return new Response(file.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
        'ETag': file.etag || '',
        'Content-Length': file.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving media:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
