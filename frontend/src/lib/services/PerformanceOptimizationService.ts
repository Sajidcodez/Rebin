/**
 * Performance Optimization Service
 * Provides caching, memoization, and performance monitoring
 * Follows best practices for performance optimization and user experience
 */

import { ILogger } from "./CommunityService";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  strategy: "lru" | "fifo" | "ttl";
  enablePersistence: boolean;
  compressionEnabled: boolean;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  cacheHit: boolean;
  dataSize: number;
  timestamp: Date;
  userId?: string;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  enableMemoization: boolean;
  enableCompression: boolean;
  enablePrefetching: boolean;
  cacheConfig: CacheConfig;
  maxConcurrentRequests: number;
  requestTimeout: number;
}

// ============================================================================
// PERFORMANCE OPTIMIZATION SERVICE
// ============================================================================

export class PerformanceOptimizationService {
  private logger: ILogger;
  private cache = new Map<string, CacheEntry>();
  private memoizationCache = new Map<string, any>();
  private performanceMetrics: PerformanceMetrics[] = [];
  private config: OptimizationConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private activeRequests = 0;

  constructor(config?: Partial<OptimizationConfig>, logger?: ILogger) {
    this.logger = logger || this.createDefaultLogger();
    this.config = {
      enableCaching: true,
      enableMemoization: true,
      enableCompression: false,
      enablePrefetching: false,
      cacheConfig: {
        maxSize: 100,
        ttl: 5 * 60 * 1000, // 5 minutes
        strategy: "lru",
        enablePersistence: true,
        compressionEnabled: false,
      },
      maxConcurrentRequests: 5,
      requestTimeout: 10000,
      ...config,
    };

    this.initializeCache();
    this.loadPersistedCache();
  }

  // ============================================================================
  // CACHING METHODS
  // ============================================================================

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enableCaching) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.logger.debug("Cache hit", { key, accessCount: entry.accessCount });
    return entry.data as T;
  }

  async set<T>(key: string, data: T, customTtl?: number): Promise<void> {
    if (!this.config.enableCaching) {
      return;
    }

    const ttl = customTtl || this.config.cacheConfig.ttl;
    const size = this.calculateDataSize(data);

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    // Check cache size limit
    if (this.cache.size >= this.config.cacheConfig.maxSize) {
      this.evictEntry();
    }

    this.cache.set(key, entry);

    // Persist to localStorage if enabled
    if (this.config.cacheConfig.enablePersistence) {
      this.persistCacheEntry(key, entry);
    }

    this.logger.debug("Cache set", { key, size, ttl });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);

    if (this.config.cacheConfig.enablePersistence) {
      localStorage.removeItem(`cache_${key}`);
    }

    this.logger.debug("Cache deleted", { key });
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.memoizationCache.clear();

    if (this.config.cacheConfig.enablePersistence) {
      this.clearPersistedCache();
    }

    this.logger.info("Cache cleared");
  }

  // ============================================================================
  // MEMOIZATION METHODS
  // ============================================================================

  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    if (!this.config.enableMemoization) {
      return fn;
    }

    return ((...args: Parameters<T>) => {
      const key = keyGenerator
        ? keyGenerator(...args)
        : this.generateMemoKey(fn.name, args);

      if (this.memoizationCache.has(key)) {
        this.logger.debug("Memoization hit", { key, function: fn.name });
        return this.memoizationCache.get(key);
      }

      const result = fn(...args);
      this.memoizationCache.set(key, result);

      this.logger.debug("Memoization set", { key, function: fn.name });
      return result;
    }) as T;
  }

  clearMemoization(): void {
    this.memoizationCache.clear();
    this.logger.info("Memoization cache cleared");
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = this.getMemoryUsage();

      const metrics: PerformanceMetrics = {
        operation,
        duration: endTime - startTime,
        cacheHit: false, // This would be set by the calling code
        dataSize: this.calculateDataSize(result),
        timestamp: new Date(),
        userId,
      };

      this.recordPerformanceMetrics(metrics);

      this.logger.debug("Performance measured", {
        operation,
        duration: metrics.duration,
        dataSize: metrics.dataSize,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();

      this.logger.error("Performance measurement failed", {
        operation,
        duration: endTime - startTime,
        error: error.message,
      });

      throw error;
    }
  }

  getPerformanceMetrics(operation?: string): PerformanceMetrics[] {
    if (operation) {
      return this.performanceMetrics.filter((m) => m.operation === operation);
    }
    return [...this.performanceMetrics];
  }

  getAveragePerformance(operation: string): {
    averageDuration: number;
    averageDataSize: number;
    totalCalls: number;
    cacheHitRate: number;
  } {
    const metrics = this.performanceMetrics.filter(
      (m) => m.operation === operation
    );

    if (metrics.length === 0) {
      return {
        averageDuration: 0,
        averageDataSize: 0,
        totalCalls: 0,
        cacheHitRate: 0,
      };
    }

    const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
    const totalDataSize = metrics.reduce((sum, m) => sum + m.dataSize, 0);
    const cacheHits = metrics.filter((m) => m.cacheHit).length;

    return {
      averageDuration: totalDuration / metrics.length,
      averageDataSize: totalDataSize / metrics.length,
      totalCalls: metrics.length,
      cacheHitRate: cacheHits / metrics.length,
    };
  }

  // ============================================================================
  // REQUEST OPTIMIZATION
  // ============================================================================

  async throttleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
          this.processRequestQueue();
        }
      };

      if (this.activeRequests < this.config.maxConcurrentRequests) {
        this.activeRequests++;
        executeRequest();
      } else {
        this.requestQueue.push(executeRequest);
      }
    });
  }

  private processRequestQueue(): void {
    if (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConcurrentRequests
    ) {
      const nextRequest = this.requestQueue.shift();
      if (nextRequest) {
        this.activeRequests++;
        nextRequest();
      }
    }
  }

  // ============================================================================
  // DATA COMPRESSION
  // ============================================================================

  private compressData(data: any): string {
    if (!this.config.enableCompression) {
      return JSON.stringify(data);
    }

    // Simple compression using JSON.stringify and basic encoding
    // In a real implementation, you might use a library like pako for gzip compression
    const jsonString = JSON.stringify(data);

    // Basic compression by removing unnecessary whitespace
    return jsonString.replace(/\s+/g, " ").trim();
  }

  private decompressData(compressedData: string): any {
    if (!this.config.enableCompression) {
      return JSON.parse(compressedData);
    }

    // Decompress the data
    return JSON.parse(compressedData);
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private evictEntry(): void {
    const strategy = this.config.cacheConfig.strategy;

    switch (strategy) {
      case "lru":
        this.evictLRU();
        break;
      case "fifo":
        this.evictFIFO();
        break;
      case "ttl":
        this.evictTTL();
        break;
    }
  }

  private evictLRU(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug("LRU eviction", { key: oldestKey });
    }
  }

  private evictFIFO(): void {
    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.logger.debug("FIFO eviction", { key: oldestKey });
    }
  }

  private evictTTL(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      this.logger.debug("TTL eviction", { key });
    });
  }

  // ============================================================================
  // PERSISTENCE
  // ============================================================================

  private persistCacheEntry(key: string, entry: CacheEntry): void {
    try {
      const serialized = JSON.stringify({
        ...entry,
        data: this.compressData(entry.data),
      });
      localStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      this.logger.warn("Failed to persist cache entry", {
        key,
        error: error.message,
      });
    }
  }

  private loadPersistedCache(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache_")
      );

      for (const key of keys) {
        const serialized = localStorage.getItem(key);
        if (serialized) {
          const entry = JSON.parse(serialized);
          entry.data = this.decompressData(entry.data);

          // Check if entry is still valid
          if (Date.now() - entry.timestamp < entry.ttl) {
            this.cache.set(key.replace("cache_", ""), entry);
          } else {
            localStorage.removeItem(key);
          }
        }
      }

      this.logger.info("Persisted cache loaded", { entries: this.cache.size });
    } catch (error) {
      this.logger.error("Failed to load persisted cache", {
        error: error.message,
      });
    }
  }

  private clearPersistedCache(): void {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("cache_")
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      this.logger.error("Failed to clear persisted cache", {
        error: error.message,
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private calculateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  private generateMemoKey(functionName: string, args: any[]): string {
    return `${functionName}_${JSON.stringify(args)}`;
  }

  private recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only the last 1000 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  private getMemoryUsage(): number {
    if ("memory" in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private initializeCache(): void {
    // Set up periodic cache cleanup
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Clean up every minute
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => {
      this.cache.delete(key);
      if (this.config.cacheConfig.enablePersistence) {
        localStorage.removeItem(`cache_${key}`);
      }
    });

    if (expiredKeys.length > 0) {
      this.logger.debug("Cache cleanup completed", {
        expiredEntries: expiredKeys.length,
      });
    }
  }

  private createDefaultLogger(): ILogger {
    return {
      info: (message: string, meta?: any) =>
        console.log(`[PerformanceOptimizationService] ${message}`, meta || ""),
      error: (message: string, meta?: any) =>
        console.error(
          `[PerformanceOptimizationService] ${message}`,
          meta || ""
        ),
      warn: (message: string, meta?: any) =>
        console.warn(`[PerformanceOptimizationService] ${message}`, meta || ""),
      debug: (message: string, meta?: any) =>
        console.debug(
          `[PerformanceOptimizationService] ${message}`,
          meta || ""
        ),
    };
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalSize: number;
  } {
    const totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0
    );
    const totalAccesses = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    const cacheHits = this.performanceMetrics.filter((m) => m.cacheHit).length;
    const totalRequests = this.performanceMetrics.length;

    return {
      size: this.cache.size,
      maxSize: this.config.cacheConfig.maxSize,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      totalSize,
    };
  }

  updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info("Performance optimization config updated", this.config);
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const performanceOptimizationService =
  new PerformanceOptimizationService();
