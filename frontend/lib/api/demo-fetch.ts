/**
 * Enhanced fetch wrapper that automatically includes demo session ID in headers
 * This enables session-based data isolation for multi-user demo mode
 */

const DEMO_SESSION_STORAGE_KEY = "demo-session-id";

export function getDemoSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
}

/**
 * Fetch wrapper that automatically adds x-demo-session-id header
 */
export async function demoFetch(
  url: string | URL | Request,
  options?: RequestInit
): Promise<Response> {
  const sessionId = getDemoSessionId();

  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...options?.headers,
      ...(sessionId ? { "x-demo-session-id": sessionId } : {}),
    },
  };

  return fetch(url, enhancedOptions);
}

/**
 * Get demo session ID from request headers (server-side)
 */
export function getDemoSessionFromRequest(request: Request): string | null {
  return request.headers.get("x-demo-session-id");
}
