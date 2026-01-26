/**
 * Fetch wrapper for admin API calls
 * Automatically adds the x-telegram-user-id header for auth in Telegram WebView
 * Also adds x-demo-session-id header if in demo mode
 */

import { useTelegramStore } from "@/lib/store/telegram";
import { getDemoSessionId } from "./demo-fetch";

export function getAdminHeaders(): HeadersInit {
  // Get Telegram user ID from store (client-side only)
  if (typeof window === "undefined") return {};

  const userId = useTelegramStore.getState().userId;
  const demoSessionId = getDemoSessionId();

  const headers: HeadersInit = {};

  if (userId) {
    headers["x-telegram-user-id"] = userId.toString();
  }

  if (demoSessionId) {
    headers["x-demo-session-id"] = demoSessionId;
  }

  return headers;
}

export async function adminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAdminHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
