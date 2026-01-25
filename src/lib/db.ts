/**
 * D1 Database Client
 * Pattern matching the original PostgreSQL client but for Cloudflare D1
 */

import type { D1Database, D1Result } from '@cloudflare/workers-types';

export type Env = {
  DB: D1Database;
  MEDIA: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  ADMIN_SESSION_SECRET: string;
  ADMIN_TELEGRAM_IDS: string;
  ENVIRONMENT: string;
  // AI/Groq
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  // Cannabis API (optional)
  CANNABIS_API_URL?: string;
};

/**
 * Execute a query and return all rows
 */
export async function query<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.all<T>();
  return result.results ?? [];
}

/**
 * Execute a query and return the first row
 */
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params);
  const result = await stmt.first<T>();
  return result ?? null;
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE) and return the result
 */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params);
  return stmt.run();
}

/**
 * Execute multiple statements in a batch (transaction-like)
 */
export async function batch<T>(
  db: D1Database,
  statements: { sql: string; params?: unknown[] }[]
): Promise<D1Result<T>[]> {
  const preparedStatements = statements.map(({ sql, params = [] }) =>
    db.prepare(sql).bind(...params)
  );
  return db.batch<T>(preparedStatements);
}

/**
 * Generate a UUID v4 (for cases where we need to generate ID in code)
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Parse JSON safely (for JSONB fields stored as TEXT)
 */
export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Convert boolean to SQLite integer (0/1)
 */
export function boolToInt(value: boolean | undefined | null): number {
  return value ? 1 : 0;
}

/**
 * Convert SQLite integer to boolean
 */
export function intToBool(value: number | undefined | null): boolean {
  return value === 1;
}
