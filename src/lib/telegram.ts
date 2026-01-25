/**
 * Telegram InitData Verification using Web Crypto API
 * Conversion from Node.js crypto to Cloudflare Workers compatible Web Crypto API
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  start_param?: string;
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const aBytes = stringToBytes(a);
  const bBytes = stringToBytes(b);

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }

  return result === 0;
}

/**
 * Create HMAC-SHA256 hash using Web Crypto API
 */
async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return crypto.subtle.sign('HMAC', cryptoKey, stringToBytes(data));
}

/**
 * Verify Telegram initData
 * @param initData - The raw initData string from Telegram WebApp
 * @param botToken - The Telegram bot token
 * @returns Parsed and verified TelegramInitData or null if invalid
 */
export async function verifyTelegramInitData(
  initData: string,
  botToken: string
): Promise<TelegramInitData | null> {
  if (!initData || !botToken) {
    return null;
  }

  try {
    // Parse the initData
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      console.error('No hash found in initData');
      return null;
    }

    // Remove hash and sort remaining parameters
    params.delete('hash');
    const dataCheckArray: string[] = [];

    // Sort parameters alphabetically
    const sortedKeys = Array.from(params.keys()).sort();
    for (const key of sortedKeys) {
      const value = params.get(key);
      if (value !== null) {
        dataCheckArray.push(`${key}=${value}`);
      }
    }

    const dataCheckString = dataCheckArray.join('\n');

    // Create secret key: HMAC-SHA256("WebAppData", botToken)
    const secretKey = await hmacSha256(stringToBytes('WebAppData'), botToken);

    // Calculate hash: HMAC-SHA256(secretKey, dataCheckString)
    const calculatedHashBuffer = await hmacSha256(secretKey, dataCheckString);
    const calculatedHash = bufferToHex(calculatedHashBuffer);

    // Compare hashes using timing-safe comparison
    if (!timingSafeEqual(calculatedHash, hash)) {
      console.error('Hash mismatch');
      return null;
    }

    // Validate auth_date (not older than 1 hour)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 3600; // 1 hour

    if (now - authDate > maxAge) {
      console.error('Auth date too old');
      return null;
    }

    // Parse user data
    const userString = params.get('user');
    let user: TelegramUser | undefined;

    if (userString) {
      try {
        user = JSON.parse(userString);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    }

    return {
      query_id: params.get('query_id') || undefined,
      user,
      auth_date: authDate,
      hash,
      start_param: params.get('start_param') || undefined,
    };
  } catch (error) {
    console.error('Error verifying Telegram initData:', error);
    return null;
  }
}

/**
 * Parse initData without verification (client-side use only)
 * WARNING: Do not use this for authentication, only for display purposes
 */
export function parseInitData(initData: string): Partial<TelegramInitData> | null {
  try {
    const params = new URLSearchParams(initData);
    const userString = params.get('user');

    let user: TelegramUser | undefined;
    if (userString) {
      user = JSON.parse(userString);
    }

    return {
      query_id: params.get('query_id') || undefined,
      user,
      auth_date: parseInt(params.get('auth_date') || '0', 10),
      hash: params.get('hash') || undefined,
      start_param: params.get('start_param') || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Extract user from initData string (client-side helper)
 */
export function extractUser(initData: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData);
    const userString = params.get('user');
    if (!userString) return null;
    return JSON.parse(userString);
  } catch {
    return null;
  }
}
