/**
 * Catch-all route for media files
 * Handles /product-media/* paths by serving from R2
 */

interface Env {
  MEDIA: R2Bucket;
  [key: string]: unknown;
}

interface PagesContext {
  request: Request;
  env: Env;
  params: {
    path?: string | string[];
    [key: string]: unknown;
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
  const { env, params } = context;

  try {
    // Use params.path from [[path]].ts route
    // params.path contains the captured path segments after /product-media/
    const pathParam = params.path || [];
    const filePath = Array.isArray(pathParam)
      ? pathParam.join('/')
      : String(pathParam);

    if (!filePath) {
      return new Response(JSON.stringify({
        error: 'No file path provided',
        params: params,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the file from R2
    const file = await env.MEDIA.get(filePath);

    if (!file) {
      console.log('File not found in R2:', filePath);
      return new Response(JSON.stringify({
        error: 'File not found',
        path: filePath,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
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
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
