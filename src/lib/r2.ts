/**
 * R2 Storage Helpers
 * Handles media uploads via presigned URLs (bypasses 100MB Workers limit)
 */

import type { R2Bucket } from '@cloudflare/workers-types';
import { generateUUID } from './db';

export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

// Allowed file types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Max file sizes
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Get file extension from content type
 */
export function getExtensionFromContentType(contentType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return extensions[contentType] || 'bin';
}

/**
 * Generate a unique file key
 */
export function generateFileKey(contentType: string, prefix: string = 'uploads'): string {
  const timestamp = Date.now();
  const uuid = generateUUID();
  const ext = getExtensionFromContentType(contentType);
  return `${prefix}/${timestamp}-${uuid}.${ext}`;
}

/**
 * Validate file type
 */
export function isValidFileType(contentType: string): boolean {
  return ALLOWED_TYPES.includes(contentType);
}

/**
 * Get max file size for content type
 */
export function getMaxFileSize(contentType: string): number {
  if (ALLOWED_VIDEO_TYPES.includes(contentType)) {
    return MAX_VIDEO_SIZE;
  }
  return MAX_IMAGE_SIZE;
}

/**
 * Upload file directly to R2 (for small files within Workers limits)
 */
export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream,
  contentType: string,
  metadata?: Record<string, string>
): Promise<UploadedFile> {
  const result = await bucket.put(key, data, {
    httpMetadata: {
      contentType,
    },
    customMetadata: metadata,
  });

  if (!result) {
    throw new Error('Failed to upload file to R2');
  }

  return {
    key: result.key,
    url: `/api/media/${result.key}`, // Served via media proxy route
    size: result.size,
    contentType,
  };
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key);
}

/**
 * Get file from R2
 */
export async function getFromR2(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return bucket.get(key);
}

/**
 * List files in R2 bucket
 */
export async function listR2Files(
  bucket: R2Bucket,
  prefix?: string,
  limit: number = 100
): Promise<R2Object[]> {
  const listed = await bucket.list({
    prefix,
    limit,
  });
  return listed.objects;
}

/**
 * Check if file exists in R2
 */
export async function fileExistsInR2(bucket: R2Bucket, key: string): Promise<boolean> {
  const head = await bucket.head(key);
  return head !== null;
}

/**
 * Validate path (no directory traversal)
 */
export function validatePath(path: string): boolean {
  // Prevent directory traversal
  if (path.includes('..')) {
    return false;
  }
  // Prevent absolute paths
  if (path.startsWith('/')) {
    return false;
  }
  return true;
}

/**
 * Create multipart upload for large files
 * Note: For files > 100MB, use presigned URLs with direct client upload
 */
export async function createMultipartUpload(
  bucket: R2Bucket,
  key: string,
  contentType: string
): Promise<R2MultipartUpload> {
  return bucket.createMultipartUpload(key, {
    httpMetadata: {
      contentType,
    },
  });
}

// Type definitions for R2
interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
}

interface R2MultipartUpload {
  key: string;
  uploadId: string;
  uploadPart(partNumber: number, value: ReadableStream | ArrayBuffer | string): Promise<R2UploadedPart>;
  abort(): Promise<void>;
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}

interface R2UploadedPart {
  partNumber: number;
  etag: string;
}
