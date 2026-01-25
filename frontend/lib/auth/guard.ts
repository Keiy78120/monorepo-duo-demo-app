import { headers, cookies } from "next/headers";
import { getAuth } from "./better-auth";
import { verifyTelegramAdminToken } from "./telegram-admin";
import { isAdmin } from "./admin-guard";

export async function getSession() {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session) return session;

  const secret =
    process.env.ADMIN_SESSION_SECRET || process.env.BETTER_AUTH_SECRET || "";

  // Check tg_admin cookie
  if (secret) {
    const cookieStore = await cookies();
    const token = cookieStore.get("tg_admin")?.value;
    if (token) {
      const payload = verifyTelegramAdminToken(token, secret);
      if (payload) {
        return {
          user: {
            id: payload.sub,
            email: "telegram-admin@local",
            name: payload.username || "Telegram Admin",
          },
        };
      }
    }
  }

  // Fallback: Check x-telegram-user-id header (for Telegram WebView where cookies don't work)
  const headersList = await headers();
  const telegramUserId = headersList.get("x-telegram-user-id");
  if (telegramUserId) {
    const adminStatus = await isAdmin(telegramUserId);
    if (adminStatus) {
      return {
        user: {
          id: telegramUserId,
          email: "telegram-admin@local",
          name: "Telegram Admin",
        },
      };
    }
  }

  return null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
