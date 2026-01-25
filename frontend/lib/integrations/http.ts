const DEFAULT_TIMEOUT_MS = 10000;

export interface FetchRetryOptions {
  retries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchJsonWithRetry<T>(
  url: string,
  options: RequestInit = {},
  { retries = 2, timeoutMs = DEFAULT_TIMEOUT_MS, retryDelayMs = 2000 }: FetchRetryOptions = {}
): Promise<T> {
  let attempt = 0;
  // Basic exponential backoff for transient failures
  while (true) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const error = new Error(`Request failed: ${response.status}`) as Error & {
          status?: number;
          body?: string;
        };
        error.status = response.status;
        error.body = text;
        throw error;
      }
      return (await response.json()) as T;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      await delay(retryDelayMs * (attempt + 1));
      attempt += 1;
    }
  }
}
