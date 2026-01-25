/**
 * Dual-Write Utility for Transition Phase
 *
 * During migration, write to both Cloudflare (primary) and Vercel (secondary)
 * to enable safe rollback.
 */

export interface DualWriteConfig {
  primaryUrl: string;
  secondaryUrl: string;
  enabled: boolean;
  secondaryTimeout: number;
}

export interface DualWriteResult<T> {
  primary: {
    success: boolean;
    data?: T;
    error?: string;
  };
  secondary?: {
    success: boolean;
    data?: T;
    error?: string;
  };
}

/**
 * Execute a write operation on both backends
 * Primary (Cloudflare) is awaited, secondary (Vercel) is fire-and-forget
 */
export async function dualWrite<T>(
  config: DualWriteConfig,
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
  headers?: Record<string, string>
): Promise<DualWriteResult<T>> {
  const result: DualWriteResult<T> = {
    primary: { success: false },
  };

  // Primary write (Cloudflare) - must succeed
  try {
    const primaryResponse = await fetch(`${config.primaryUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!primaryResponse.ok) {
      const errorText = await primaryResponse.text();
      result.primary = {
        success: false,
        error: `HTTP ${primaryResponse.status}: ${errorText}`,
      };
      return result;
    }

    const primaryData = await primaryResponse.json() as T;
    result.primary = {
      success: true,
      data: primaryData,
    };
  } catch (error) {
    result.primary = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return result;
  }

  // Secondary write (Vercel) - fire and forget, don't block
  if (config.enabled && config.secondaryUrl) {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.secondaryTimeout);

    fetch(`${config.secondaryUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
      .then(async (response) => {
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          result.secondary = { success: true, data };
          console.log(`[DualWrite] Secondary write succeeded: ${endpoint}`);
        } else {
          const errorText = await response.text();
          result.secondary = {
            success: false,
            error: `HTTP ${response.status}: ${errorText}`,
          };
          console.warn(`[DualWrite] Secondary write failed: ${endpoint} - ${errorText}`);
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.secondary = { success: false, error: errorMessage };
        console.warn(`[DualWrite] Secondary write error: ${endpoint} - ${errorMessage}`);
      });
  }

  return result;
}

/**
 * Verify data consistency between backends
 * Useful for monitoring during dual-write phase
 */
export async function verifyConsistency(
  config: DualWriteConfig,
  endpoint: string
): Promise<{
  consistent: boolean;
  primaryCount: number;
  secondaryCount: number;
  diff?: string[];
}> {
  const [primaryResponse, secondaryResponse] = await Promise.all([
    fetch(`${config.primaryUrl}${endpoint}`).catch(() => null),
    fetch(`${config.secondaryUrl}${endpoint}`).catch(() => null),
  ]);

  if (!primaryResponse || !secondaryResponse) {
    return {
      consistent: false,
      primaryCount: 0,
      secondaryCount: 0,
      diff: ['Failed to fetch from one or both backends'],
    };
  }

  const primaryData = await primaryResponse.json() as unknown[];
  const secondaryData = await secondaryResponse.json() as unknown[];

  const primaryCount = Array.isArray(primaryData) ? primaryData.length : 0;
  const secondaryCount = Array.isArray(secondaryData) ? secondaryData.length : 0;

  return {
    consistent: primaryCount === secondaryCount,
    primaryCount,
    secondaryCount,
    diff: primaryCount !== secondaryCount ? [`Count mismatch: ${primaryCount} vs ${secondaryCount}`] : undefined,
  };
}

/**
 * Default dual-write config (disabled by default)
 */
export function getDefaultConfig(): DualWriteConfig {
  return {
    primaryUrl: '', // Set from environment
    secondaryUrl: '', // Set from environment
    enabled: false,
    secondaryTimeout: 5000, // 5 seconds
  };
}
