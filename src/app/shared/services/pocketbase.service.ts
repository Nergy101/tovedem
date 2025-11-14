/* eslint-disable @typescript-eslint/no-explicit-any */
import { inject, Injectable } from '@angular/core';

import PocketBase, { BaseModel, RecordModel, RecordService } from 'pocketbase';
import { Page } from '../../models/pocketbase/page.model';
import { Environment } from '../../../environment';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root',
})
export class PocketbaseService {
  environment = inject(Environment);
  client: PocketBase;

  // Direct client access that bypasses caching (for member/admin pages that need fresh data)
  // Use this instead of client.client when you need to bypass the cache layer
  readonly directClient: PocketBase;

  // Cache storage: Map<cacheKey, CacheEntry>
  private cache = new Map<string, CacheEntry<any>>();

  // Default TTL: 15 minutes
  private readonly defaultTtl = 15 * 60 * 1000;

  // Maximum cache size to prevent unbounded growth
  private readonly maxCacheSize = 100;

  // Debug mode - set to true to see cache hits/misses in console
  // Set to true to always enable, or use environment.production to auto-enable in dev
  debugMode = true; // Always enabled for now - set to false to disable

  constructor() {
    this.client = new PocketBase(this.environment.pocketbase.baseUrl);
    this.directClient = this.client; // Alias for clearer naming when bypassing cache

    // Enable debug mode automatically in development (if debugMode wasn't explicitly set)
    // Uncomment the line below to auto-enable based on environment:
    // this.debugMode = !this.environment.production;

    // Force enable debug mode - remove this line to disable
    this.debugMode = true;

    console.log('[Cache] PocketbaseService initialized');
    console.log('[Cache] Debug mode:', this.debugMode);
    console.log('[Cache] Environment production:', this.environment.production);
    if (this.debugMode) {
      console.log('[Cache] Debug mode enabled. Cache TTL: 15 minutes');
    }
  }

  async create<T>(collectionName: string, item: Partial<T>): Promise<T> {
    const result = await this.getCollection(collectionName).create(item as any);
    // Invalidate all cache entries for this collection since we added a new record
    this.clearCache(collectionName);
    return result as unknown as T;
  }

  async update<T extends BaseModel>(
    collectionName: string,
    item: T
  ): Promise<T> {
    const result = await this.getCollection(collectionName).update(
      item.id,
      item
    );
    // Invalidate cache for this specific record and all collection entries
    this.invalidateRecordCache(collectionName, item.id);
    return result as unknown as T;
  }

  async delete(collectionName: string, id: string): Promise<boolean> {
    const result = await this.client.collection(collectionName).delete(id);
    // Invalidate cache for this specific record and all collection entries
    this.invalidateRecordCache(collectionName, id);
    return result;
  }

  async getOne<T>(
    collectionName: string,
    id: string,
    options?: {
      expand?: string;
      filter?: string;
      sort?: string;
    }
  ): Promise<T> {
    const cacheKey = this.generateCacheKey('getOne', collectionName, {
      id,
      ...options,
    });
    const cached = this.getCached<T>(cacheKey);
    if (cached !== null) {
      return cached as T;
    }

    const data = await this.getCollection(collectionName).getOne(id, options);
    const typedData = data as T;
    this.setCached(cacheKey, typedData);
    return typedData;
  }

  async getAll<T>(
    collectionName: string,
    options?: {
      expand?: string;
      filter?: string;
      sort?: string;
    }
  ): Promise<T[]> {
    // Always log to verify method is being called
    console.log(`[Cache] getAll() called - collection: ${collectionName}`, {
      debugMode: this.debugMode,
      options,
    });

    const cacheKey = this.generateCacheKey('getAll', collectionName, options);
    console.log(`[Cache] Generated cache key: ${cacheKey}`);

    const cached = this.getCached<T[]>(cacheKey);
    if (cached !== null) {
      console.log(`[Cache] Returning cached data for: ${cacheKey}`);
      return cached as T[];
    }

    console.log(`[Cache] Cache miss - fetching from API: ${collectionName}`);
    const data = await this.getCollection(collectionName).getFullList(options);
    const typedData = data as T[];
    console.log(`[Cache] Storing in cache: ${cacheKey}`, {
      dataLength: typedData.length,
    });
    this.setCached(cacheKey, typedData);
    return typedData;
  }

  async getPage<T>(
    collectionName: string,
    page: number,
    perPage: number,
    expand?: string
  ): Promise<Page<T>> {
    const options = { page, perPage, expand };
    const cacheKey = this.generateCacheKey('getPage', collectionName, options);
    const cached = this.getCached<Page<T>>(cacheKey);
    if (cached !== null) {
      return cached as Page<T>;
    }

    const pbPage = await this.getCollection(collectionName).getList(
      page,
      perPage,
      { expand }
    );

    const pageModel = {
      page,
      perPage,
      items: pbPage.items as T[],
      totalItems: pbPage.totalItems,
      totalPages: pbPage.totalPages,
    } as Page<T>;

    this.setCached(cacheKey, pageModel);
    return pageModel;
  }

  async getFileToken(): Promise<string> {
    return await this.client.files.getToken();
  }

  /**
   * Clear all cache entries for a specific collection
   */
  clearCache(collectionName?: string): void {
    if (collectionName) {
      // Clear only entries for this collection
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.startsWith(`${collectionName}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach((key) => this.cache.delete(key));
      if (this.debugMode) {
        console.log(
          `[Cache CLEARED] ${keysToDelete.length} entries for collection: ${collectionName}`
        );
      }
    } else {
      // Clear all cache
      const size = this.cache.size;
      this.cache.clear();
      if (this.debugMode) {
        console.log(`[Cache CLEARED] All ${size} entries`);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      remaining: number;
    }>;
  } {
    const entries: Array<{
      key: string;
      age: number;
      ttl: number;
      remaining: number;
    }> = [];
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp;
      const remaining = Math.max(0, entry.ttl - age);
      entries.push({
        key,
        age: Math.round(age / 1000),
        ttl: Math.round(entry.ttl / 1000),
        remaining: Math.round(remaining / 1000),
      });
    });

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: entries.sort((a, b) => b.remaining - a.remaining), // Sort by remaining TTL
    };
  }

  /**
   * Log cache statistics to console (useful for debugging)
   */
  logCacheStats(): void {
    const stats = this.getCacheStats();
    console.group('[Cache Statistics]');
    console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
    if (stats.entries.length > 0) {
      console.table(stats.entries);
    } else {
      console.log('No cached entries');
    }
    console.groupEnd();
  }

  /**
   * Generate a cache key from method name, collection, and options
   */
  private generateCacheKey(
    method: string,
    collectionName: string,
    options?: any
  ): string {
    const optionsStr = options ? JSON.stringify(options) : '';
    return `${collectionName}:${method}:${optionsStr}`;
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  private getCached<T>(cacheKey: string): T | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      if (this.debugMode) {
        console.log(`[Cache MISS] ${cacheKey}`);
      }
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Cache expired, remove it
      this.cache.delete(cacheKey);
      if (this.debugMode) {
        console.log(
          `[Cache EXPIRED] ${cacheKey} (age: ${Math.round(age / 1000)}s)`
        );
      }
      return null;
    }

    if (this.debugMode) {
      const remainingTtl = Math.round((entry.ttl - age) / 1000);
      console.log(`[Cache HIT] ${cacheKey} (TTL remaining: ${remainingTtl}s)`);
    }
    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  private setCached<T>(cacheKey: string, data: T, ttl?: number): void {
    // If cache is too large, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        if (this.debugMode) {
          console.log(`[Cache] Removed oldest entry to make room: ${firstKey}`);
        }
      }
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });

    if (this.debugMode) {
      console.log(
        `[Cache STORED] ${cacheKey} (TTL: ${Math.round(
          (ttl ?? this.defaultTtl) / 1000
        )}s)`
      );
    }
  }

  /**
   * Invalidate cache for a specific record
   */
  private invalidateRecordCache(
    collectionName: string,
    recordId: string
  ): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      // Invalidate all entries for this collection and specific record
      if (key.startsWith(`${collectionName}:getOne:`)) {
        const keyOptions = key.split(':').slice(2).join(':');
        if (keyOptions.includes(recordId)) {
          keysToDelete.push(key);
        }
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));

    // Also invalidate all collection-level caches
    this.clearCache(collectionName);
  }

  private getCollection(nameOrId: string): RecordService<RecordModel> {
    return this.client.collection(nameOrId);
  }
}
