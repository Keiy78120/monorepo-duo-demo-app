/**
 * Migrate media files from Supabase Storage to R2
 *
 * Usage: npx ts-node scripts/migration/migrate-media.ts
 *
 * Requires:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_API_TOKEN
 * - R2_BUCKET_NAME
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// R2 configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'vhash-media';

const DOWNLOAD_DIR = path.join(__dirname, '../../data/media');
const MAPPING_FILE = path.join(__dirname, '../../data/media-mapping.json');

interface FileMapping {
  supabasePath: string;
  r2Key: string;
  migrated: boolean;
  error?: string;
}

async function downloadFromSupabase(bucketName: string, filePath: string): Promise<Buffer | null> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);

  if (error) {
    console.error(`  Error downloading ${filePath}:`, error.message);
    return null;
  }

  return Buffer.from(await data.arrayBuffer());
}

async function uploadToR2(key: string, data: Buffer, contentType: string): Promise<boolean> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(key)}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  R2 upload error for ${key}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`  R2 upload exception for ${key}:`, error);
    return false;
  }
}

async function listSupabaseFiles(bucketName: string): Promise<string[]> {
  const files: string[] = [];

  const { data, error } = await supabase.storage
    .from(bucketName)
    .list('', { limit: 1000 });

  if (error) {
    console.error(`Error listing files in ${bucketName}:`, error.message);
    return files;
  }

  for (const item of data || []) {
    if (item.name) {
      files.push(item.name);
    }
  }

  return files;
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
  };
  return types[ext] || 'application/octet-stream';
}

async function main() {
  console.log('Supabase → R2 Media Migration\n');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    console.error('Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
    process.exit(1);
  }

  // Create directories
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const bucketName = 'product-media';
  console.log(`Listing files in Supabase bucket: ${bucketName}`);

  const files = await listSupabaseFiles(bucketName);
  console.log(`Found ${files.length} files\n`);

  const mapping: FileMapping[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    console.log(`Migrating: ${file}`);

    const fileMapping: FileMapping = {
      supabasePath: `${bucketName}/${file}`,
      r2Key: `product-media/${file}`,
      migrated: false,
    };

    // Download from Supabase
    const data = await downloadFromSupabase(bucketName, file);
    if (!data) {
      fileMapping.error = 'Download failed';
      errorCount++;
      mapping.push(fileMapping);
      continue;
    }

    // Save locally (optional, for backup)
    const localPath = path.join(DOWNLOAD_DIR, file);
    fs.writeFileSync(localPath, data);

    // Upload to R2
    const contentType = getContentType(file);
    const uploaded = await uploadToR2(fileMapping.r2Key, data, contentType);

    if (uploaded) {
      fileMapping.migrated = true;
      successCount++;
      console.log(`  ✓ Migrated to R2`);
    } else {
      fileMapping.error = 'Upload failed';
      errorCount++;
    }

    mapping.push(fileMapping);
  }

  // Save mapping file
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

  console.log('\n--- Migration Summary ---');
  console.log(`Total files: ${files.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Mapping saved to: ${MAPPING_FILE}`);

  if (errorCount > 0) {
    console.log('\nFailed files:');
    mapping
      .filter(m => !m.migrated)
      .forEach(m => console.log(`  - ${m.supabasePath}: ${m.error}`));
  }
}

main().catch(console.error);
