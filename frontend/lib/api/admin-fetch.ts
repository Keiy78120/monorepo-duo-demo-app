/**
 * Fetch wrapper for admin API calls
 * Automatically adds the x-telegram-user-id header for auth in Telegram WebView
 */

import { useTelegramStore } from "@/lib/store/telegram";

export function getAdminHeaders(): HeadersInit {
  // Get Telegram user ID from store (client-side only)
  if (typeof window === "undefined") return {};

  const userId = useTelegramStore.getState().userId;
  if (!userId) return {};

  return {
    "x-telegram-user-id": userId.toString(),
  };
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
