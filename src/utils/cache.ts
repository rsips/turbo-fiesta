// Simple in-memory cache with TTL

interface CacheItem {
  data: any;
  expires: number;
}

export class SimpleCache {
  private store: Map<string, CacheItem> = new Map();

  /**
   * Set a cache item with TTL
   */
  set(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { data, expires });
  }

  /**
   * Get a cache item if it exists and hasn't expired
   */
  get(key: string): any | null {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear expired entries (for cleanup)
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expires) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new SimpleCache();

// Optional: Periodic cleanup (every 60 seconds)
setInterval(() => {
  cache.clearExpired();
}, 60000);
