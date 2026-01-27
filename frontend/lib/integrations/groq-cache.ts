/**
 * Groq Cache Infrastructure
 *
 * In-memory LRU cache for Groq API responses
 * Reduces API calls and improves response times
 */

interface CacheEntry {
  data: string;
  timestamp: number;
  size: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private maxEntries: number;
  private ttl: number;
  private currentSize: number = 0;

  constructor(options: { maxSize: number; maxEntries: number; ttl: number }) {
    this.maxSize = options.maxSize;
    this.maxEntries = options.maxEntries;
    this.ttl = options.ttl;

    // Cleanup expired entries every 5 minutes
    if (typeof window !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: string): void {
    const size = data.length;

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentSize -= oldEntry.size;
      this.cache.delete(key);
    }

    // Evict oldest entries if needed
    while (
      this.cache.size >= this.maxEntries ||
      this.currentSize + size > this.maxSize
    ) {
      const firstKey = this.cache.keys().next().value;
      if (!firstKey) break;
      this.delete(firstKey);
    }

    // Add new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size,
    });
    this.currentSize += size;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.cache.delete(key);
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      size: this.currentSize,
      maxSize: this.maxSize,
      maxEntries: this.maxEntries,
    };
  }
}

// Global cache instance
const cache = new SimpleCache({
  maxSize: 5_000_000, // 5MB max
  maxEntries: 500, // 500 entries max
  ttl: 1000 * 60 * 60 * 24, // 24h TTL
});

/**
 * Get cached value
 */
export function getCached(key: string): string | null {
  return cache.get(key);
}

/**
 * Set cached value
 */
export function setCache(key: string, data: string): void {
  cache.set(key, data);
}

/**
 * Generate cache key from prompt and model
 */
export function generateCacheKey(prompt: string, model: string): string {
  // Simple hash function
  let hash = 0;
  const input = `${model}:${prompt}`;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `groq:${model}:${Math.abs(hash).toString(36)}`;
}

/**
 * Clear all cached entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}
