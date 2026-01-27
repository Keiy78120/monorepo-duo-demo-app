/**
 * Media Serving API
 * GET /api/media/* - Serve files from R2 bucket
 * This acts as a proxy for R2 files, allowing public access without exposing R2 directly
 */

import type { Env } from '../../../src/lib/db';

interface PagesContext {
  request: Request;
  env: Env;
  params: {
    path?: string[];
  };
}

// Cache duration in seconds (1 day)
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
  const { env, params } = context;

  try {
    // Reconstruct the file path from the path segments
    const pathSegments = params.path || [];
    const filePath = pathSegments.join('/');

    if (!filePath) {
      return new Response('File path required', { status: 400 });
    }

    // Get the file from R2 directly
    const file = await env.MEDIA.get(filePath);

    if (!file) {
      console.log('File not found in R2:', filePath);

      // Return a 1x1 transparent placeholder instead of 404
      // This prevents broken images in the UI
      const transparentPixel = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      ), c => c.charCodeAt(0));

      return new Response(transparentPixel, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=60', // Cache for 1 minute only
        },
      });
    }

    // Determine content type from extension
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Return the file with proper headers
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
