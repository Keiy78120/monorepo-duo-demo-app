import crypto from "crypto";

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
 * Validates Telegram Mini App init data
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string
): { valid: boolean; data: TelegramInitData | null } {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");

    if (!hash) {
      return { valid: false, data: null };
    }

    // Remove hash from params and sort
    urlParams.delete("hash");
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Create secret key using HMAC-SHA256 with "WebAppData" as key
    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Calculate hash
    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) {
      return { valid: false, data: null };
    }

    // Parse user data
    const userStr = urlParams.get("user");
    const user = userStr ? JSON.parse(userStr) : undefined;

    const data: TelegramInitData = {
      query_id: urlParams.get("query_id") || undefined,
      user,
      auth_date: parseInt(urlParams.get("auth_date") || "0", 10),
      hash,
      start_param: urlParams.get("start_param") || undefined,
    };

    // Check if auth_date is not too old (max 1 hour)
    const now = Math.floor(Date.now() / 1000);
    if (now - data.auth_date > 3600) {
      return { valid: false, data: null };
    }

    return { valid: true, data };
  } catch {
    return { valid: false, data: null };
  }
}

/**
 * Extract user info from init data without verification (for client-side use)
 */
export function parseInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get("user");
    const user = userStr ? JSON.parse(userStr) : undefined;

    return {
      query_id: urlParams.get("query_id") || undefined,
      user,
      auth_date: parseInt(urlParams.get("auth_date") || "0", 10),
      hash: urlParams.get("hash") || "",
      start_param: urlParams.get("start_param") || undefined,
    };
  } catch {
    return null;
  }
}
