/**
 * Admin Guard - Whitelist-based access control
 *
 * Vérifie que le Telegram User ID est dans la whitelist des admins
 * ou dans la base de données avec is_admin = true
 */

import { query } from "@/lib/db/client";

// Get admin IDs from environment variable
export function getAdminIds(): string[] {
  const adminIds = process.env.ADMIN_TELEGRAM_IDS || "";
  return adminIds.split(",").map(id => id.trim()).filter(Boolean);
}

// Sync check - only checks env var (for middleware compatibility)
export function isAdminSync(telegramUserId: string): boolean {
  // En développement, on peut bypass si configuré
  const isDev = process.env.NODE_ENV === "development";
  const bypassAdminCheck = process.env.BYPASS_ADMIN_CHECK === "true";

  if (isDev && bypassAdminCheck) {
    console.warn("⚠️ BYPASS_ADMIN_CHECK activé - Accès admin sans vérification");
    return true;
  }

  const adminIds = getAdminIds();
  return adminIds.includes(telegramUserId);
}

// Async check - checks both env var AND database
export async function isAdmin(telegramUserId: string): Promise<boolean> {
  // En développement, on peut bypass si configuré
  const isDev = process.env.NODE_ENV === "development";
  const bypassAdminCheck = process.env.BYPASS_ADMIN_CHECK === "true";

  if (isDev && bypassAdminCheck) {
    console.warn("⚠️ BYPASS_ADMIN_CHECK activé - Accès admin sans vérification");
    return true;
  }

  // First check env var (fast path)
  const adminIds = getAdminIds();
  console.log(`[isAdmin] Checking ${telegramUserId}, env adminIds: [${adminIds.join(", ")}]`);
  if (adminIds.includes(telegramUserId)) {
    console.log(`[isAdmin] ${telegramUserId} found in env var`);
    return true;
  }

  // Then check database
  try {
    const result = await query(
      `SELECT is_admin FROM telegram_contacts WHERE telegram_user_id = $1 LIMIT 1`,
      [telegramUserId]
    ) as { is_admin: boolean }[] | null;
    if (result && result.length > 0 && result[0].is_admin === true) {
      return true;
    }
  } catch (error) {
    // Column might not exist yet or query failed - log and continue
    console.warn("isAdmin DB check failed:", error);
  }

  return false;
}

// Legacy sync function for backwards compatibility - only checks env var
export { isAdminSync as isAdminFromEnv };
