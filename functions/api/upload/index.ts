/**
 * Upload API
 * POST /api/upload - Upload file to R2 (admin only)
 * DELETE /api/upload - Delete file from R2 (admin only)
 */

import type { Env } from '../../../src/lib/db';
import { requireAdmin } from '../../../src/lib/auth';
import {
  uploadToR2,
  deleteFromR2,
  generateFileKey,
  isValidFileType,
  getMaxFileSize,
  validatePath,
} from '../../../src/lib/r2';

interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const contentType = file.type;

    // Validate file type
    if (!isValidFileType(contentType)) {
      return new Response(JSON.stringify({
        error: 'Invalid file type',
        allowed: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file size
    const maxSize = getMaxFileSize(contentType);
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: 'File too large',
        maxSize: maxSize,
        fileSize: file.size,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const key = generateFileKey(contentType, 'product-media');
    const arrayBuffer = await file.arrayBuffer();

    const uploaded = await uploadToR2(env.MEDIA, key, arrayBuffer, contentType);

    return new Response(JSON.stringify({
      url: uploaded.url,
      path: uploaded.key,
      key: uploaded.key,
      size: uploaded.size,
      type: contentType,
    }), {
      status: 201,
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
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    await requireAdmin(request, env.DB, env.ADMIN_SESSION_SECRET, env.ADMIN_TELEGRAM_IDS);

    const filePath = url.searchParams.get('file') || url.searchParams.get('path');

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'File path is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate path
    if (!validatePath(filePath)) {
      return new Response(JSON.stringify({ error: 'Invalid file path' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await deleteFromR2(env.MEDIA, filePath);

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
    console.error('Error deleting file:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
