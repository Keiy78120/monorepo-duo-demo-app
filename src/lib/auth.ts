/**
 * Custom Authentication for D1
 * Replaces Better Auth with a simple D1-backed session system
 */

import type { D1Database } from '@cloudflare/workers-types';
import { query, queryOne, execute, generateUUID, nowISO } from './db';

export interface AdminSession {
  id: string;
  telegram_user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface SessionUser {
  telegramUserId: string;
  username?: string;
  isAdmin: boolean;
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert ArrayBuffer to base64url
 */
function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert base64url to ArrayBuffer
 */
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Create HMAC-SHA256 signature
 */
async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToBytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, stringToBytes(data));
  return bufferToBase64url(signature);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = stringToBytes(a);
  const bBytes = stringToBytes(b);
  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

export interface AdminTokenPayload {
  sub: string; // telegram user ID
  username?: string | null;
  exp: number; // expiration timestamp (ms)
}

/**
 * Sign a Telegram admin token (JWT-like)
 */
export async function signAdminToken(
  payload: AdminTokenPayload,
  secret: string
): Promise<string> {
  const body = bufferToBase64url(stringToBytes(JSON.stringify(payload)).buffer);
  const signature = await sign(body, secret);
  return `${body}.${signature}`;
}

/**
 * Verify a Telegram admin token
 */
export async function verifyAdminToken(
  token: string,
  secret: string
): Promise<AdminTokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [body, signature] = parts;
    const expectedSignature = await sign(body, secret);

    if (!timingSafeEqual(signature, expectedSignature)) {
      return null;
    }

    const payloadBytes = base64urlToBuffer(body);
    const payloadString = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadString) as AdminTokenPayload;

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if user is admin (from env var or database)
 */
export async function isAdmin(
  db: D1Database,
  telegramUserId: string,
  adminTelegramIds: string
): Promise<boolean> {
  // Check env var first (fast path)
  const adminIds = adminTelegramIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (adminIds.includes(telegramUserId)) {
    return true;
  }

  // Check database
  const contact = await queryOne<{ is_admin: number }>(
    db,
    'SELECT is_admin FROM telegram_contacts WHERE telegram_user_id = ?',
    [telegramUserId]
  );

  return contact?.is_admin === 1;
}

/**
 * Create a new admin session in D1
 */
export async function createAdminSession(
  db: D1Database,
  telegramUserId: number,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminSession> {
  const id = generateUUID();
  const token = generateUUID();
  const now = nowISO();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  await execute(
    db,
    `INSERT INTO admin_sessions (id, telegram_user_id, token, expires_at, created_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, telegramUserId, token, expiresAt, now, ipAddress || null, userAgent || null]
  );

  return {
    id,
    telegram_user_id: telegramUserId,
    token,
    expires_at: expiresAt,
    created_at: now,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  };
}

/**
 * Get admin session by token
 */
export async function getAdminSessionByToken(
  db: D1Database,
  token: string
): Promise<AdminSession | null> {
  const session = await queryOne<AdminSession>(
    db,
    `SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')`,
    [token]
  );

  return session;
}

/**
 * Delete expired sessions (cleanup)
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<number> {
  const result = await execute(
    db,
    `DELETE FROM admin_sessions WHERE expires_at <= datetime('now')`
  );
  return result.meta.changes ?? 0;
}

/**
 * Delete a specific session (logout)
 */
export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await execute(db, `DELETE FROM admin_sessions WHERE token = ?`, [token]);
}

/**
 * Get session from request (checks cookie and header)
 */
export async function getSession(
  request: Request,
  db: D1Database,
  adminSessionSecret: string,
  adminTelegramIds: string
): Promise<SessionUser | null> {
  // Check tg_admin cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);
  const tgAdminToken = cookies['tg_admin'];

  if (tgAdminToken) {
    const payload = await verifyAdminToken(tgAdminToken, adminSessionSecret);
    if (payload) {
      const isUserAdmin = await isAdmin(db, payload.sub, adminTelegramIds);
      return {
        telegramUserId: payload.sub,
        username: payload.username || undefined,
        isAdmin: isUserAdmin,
      };
    }
  }

  // Check x-telegram-user-id header (WebView fallback)
  const telegramUserId = request.headers.get('x-telegram-user-id');
  if (telegramUserId) {
    const isUserAdmin = await isAdmin(db, telegramUserId, adminTelegramIds);
    return {
      telegramUserId,
      isAdmin: isUserAdmin,
    };
  }

  return null;
}

/**
 * Require authenticated session (throws if not authenticated)
 */
export async function requireAuth(
  request: Request,
  db: D1Database,
  adminSessionSecret: string,
  adminTelegramIds: string
): Promise<SessionUser> {
  const session = await getSession(request, db, adminSessionSecret, adminTelegramIds);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Require admin session (throws if not admin)
 */
export async function requireAdmin(
  request: Request,
  db: D1Database,
  adminSessionSecret: string,
  adminTelegramIds: string
): Promise<SessionUser> {
  const session = await requireAuth(request, db, adminSessionSecret, adminTelegramIds);
  if (!session.isAdmin) {
    throw new Error('Forbidden: Admin access required');
  }
  return session;
}

/**
 * Parse cookies from header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  }
  return cookies;
}

/**
 * Create Set-Cookie header for admin token
 */
export function createAdminCookie(token: string, maxAge: number = 7 * 24 * 60 * 60): string {
  const secure = true; // Always secure on Cloudflare
  return `tg_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

/**
 * Create Set-Cookie header to clear admin cookie
 */
export function clearAdminCookie(): string {
  return `tg_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
