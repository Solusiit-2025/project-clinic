import NodeCache from 'node-cache';

// Standard TTL: 5 minutes (300 seconds)
// checkperiod: 60 seconds (garbage collection check)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * CacheService provides a simple wrapper around node-cache for standardizing 
 * in-memory caching across backend controllers.
 */
export const CacheService = {
  get: <T>(key: string): T | undefined => {
    return cache.get<T>(key);
  },
  
  set: (key: string, value: any, ttl?: number) => {
    cache.set(key, value, ttl || 300);
  },
  
  del: (key: string | string[]) => {
    cache.del(key);
  },
  
  flush: () => {
    cache.flushAll();
  },

  /**
   * Helper to either return cached data or fetch it, cache it, and return it.
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = cache.get<T>(key);
    if (cached !== undefined) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
    
    console.log(`[Cache] MISS: ${key}`);
    const freshData = await fetchFn();
    cache.set(key, freshData, ttl || 300);
    return freshData;
  }
};
