/**
 * Rate Limiting Infrastructure
 *
 * In-memory rate limiter for API endpoints
 * Production: Consider using Upstash Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  reset: number;
}

// In-memory storage for rate limit tracking
const requestCounts = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with success status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<{
  success: boolean;
  reset: number;
  remaining: number;
  limit: number;
}> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const entry = requestCounts.get(key);

  // Reset window if expired
  if (!entry || entry.reset < now) {
    const newReset = now + windowMs;
    requestCounts.set(key, { count: 1, reset: newReset });
    return {
      success: true,
      reset: newReset,
      remaining: limit - 1,
      limit,
    };
  }

  // Check if limit exceeded
  if (entry.count >= limit) {
    return {
      success: false,
      reset: entry.reset,
      remaining: 0,
      limit,
    };
  }

  // Increment counter
  entry.count++;

  return {
    success: true,
    reset: entry.reset,
    remaining: limit - entry.count,
    limit,
  };
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.reset < now) {
      requestCounts.delete(key);
    }
  }
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.reset).toISOString(),
    "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
  };
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats() {
  return {
    totalEntries: requestCounts.size,
    entries: Array.from(requestCounts.entries()).map(([key, entry]) => ({
      key,
      count: entry.count,
      reset: new Date(entry.reset).toISOString(),
    })),
  };
}

// Periodic cleanup (every minute)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, 60000);
}
