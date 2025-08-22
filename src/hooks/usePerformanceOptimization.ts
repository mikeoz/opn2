/**
 * Performance & Scalability Optimization Hooks
 * 
 * DEMO MODE: Client-side caching and optimization
 * ALPHA TESTING: Full server-side optimization with CDN and database tuning
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  dataSize: number;
  timestamp: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();
  private isDemoMode = true;
  private metrics: PerformanceMetrics[] = [];

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });

    // Demo Mode: Limit cache size
    if (this.isDemoMode && this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.metrics.length > 0 
        ? this.metrics.filter(m => m.cacheHit).length / this.metrics.length 
        : 0,
      avgQueryTime: this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.queryTime, 0) / this.metrics.length
        : 0,
      isDemoMode: this.isDemoMode
    };
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    // Keep only last 100 metrics in demo mode
    if (this.isDemoMode && this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }
}

const performanceCache = new PerformanceCache();

/**
 * Hook for optimized family tree queries
 */
export const useFamilyTreeOptimization = (familyUnits: any[] = []) => {
  const [optimizedTree, setOptimizedTree] = useState<any[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  const buildOptimizedTree = useCallback(async () => {
    const cacheKey = `family-tree-${JSON.stringify(familyUnits.map(f => f.id)).slice(0, 50)}`;
    const startTime = Date.now();
    
    // Check cache first
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      setOptimizedTree(cached);
      performanceCache.recordMetric({
        queryTime: Date.now() - startTime,
        cacheHit: true,
        dataSize: JSON.stringify(cached).length,
        timestamp: Date.now()
      });
      return;
    }

    setIsBuilding(true);
    
    try {
      // Demo Mode: Client-side tree optimization
      const nodeMap = new Map();
      const rootNodes: any[] = [];

      // Build optimized node structure
      familyUnits.forEach(family => {
        const node = {
          id: family.id,
          family,
          level: family.generation_level || 1,
          children: [],
          parent: null,
          metadata: {
            memberCount: family.member_count || 0,
            isActive: family.is_active !== false,
            depth: 0
          }
        };
        nodeMap.set(family.id, node);
      });

      // Build relationships and calculate depths
      familyUnits.forEach(family => {
        const node = nodeMap.get(family.id);
        if (family.parent_family_unit_id) {
          const parent = nodeMap.get(family.parent_family_unit_id);
          if (parent) {
            parent.children.push(node);
            node.parent = parent;
            node.metadata.depth = parent.metadata.depth + 1;
          }
        } else {
          rootNodes.push(node);
        }
      });

      // Sort for optimal rendering
      const sortedTree = rootNodes
        .sort((a, b) => a.level - b.level)
        .map(node => this.sortNodeChildren(node));

      setOptimizedTree(sortedTree);
      performanceCache.set(cacheKey, sortedTree, 600000); // 10 minutes

      performanceCache.recordMetric({
        queryTime: Date.now() - startTime,
        cacheHit: false,
        dataSize: JSON.stringify(sortedTree).length,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Family tree optimization failed:', error);
      setOptimizedTree(familyUnits);
    } finally {
      setIsBuilding(false);
    }
  }, [familyUnits]);

  const sortNodeChildren = (node: any): any => {
    if (node.children.length > 0) {
      node.children = node.children
        .sort((a: any, b: any) => {
          // Sort by level first, then by member count
          if (a.level !== b.level) return a.level - b.level;
          return (b.metadata.memberCount || 0) - (a.metadata.memberCount || 0);
        })
        .map((child: any) => this.sortNodeChildren(child));
    }
    return node;
  };

  useEffect(() => {
    if (familyUnits.length > 0) {
      buildOptimizedTree();
    }
  }, [buildOptimizedTree]);

  return {
    optimizedTree,
    isBuilding,
    refresh: buildOptimizedTree,
    cache: {
      stats: performanceCache.getStats(),
      clear: () => performanceCache.clear(),
      invalidate: (pattern: string) => performanceCache.invalidate(pattern)
    }
  };
};

/**
 * Hook for CARD catalog caching
 */
export const useCardCatalogCache = () => {
  const [cacheStats, setCacheStats] = useState(performanceCache.getStats());

  const getCachedCards = useCallback(async (query: any) => {
    const cacheKey = `cards-${JSON.stringify(query)}`;
    const startTime = Date.now();

    const cached = performanceCache.get(cacheKey);
    if (cached) {
      performanceCache.recordMetric({
        queryTime: Date.now() - startTime,
        cacheHit: true,
        dataSize: JSON.stringify(cached).length,
        timestamp: Date.now()
      });
      return cached;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('user_cards')
      .select('*')
      .match(query);

    if (error) throw error;

    // Cache the result
    performanceCache.set(cacheKey, data, 300000); // 5 minutes
    performanceCache.recordMetric({
      queryTime: Date.now() - startTime,
      cacheHit: false,
      dataSize: JSON.stringify(data || []).length,
      timestamp: Date.now()
    });

    return data;
  }, []);

  const invalidateCardCache = useCallback((cardId?: string) => {
    if (cardId) {
      performanceCache.invalidate(`cards-`);
    } else {
      performanceCache.invalidate('cards-');
    }
    setCacheStats(performanceCache.getStats());
  }, []);

  const updateCacheStats = useCallback(() => {
    setCacheStats(performanceCache.getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateCacheStats, 5000);
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  return {
    getCachedCards,
    invalidateCardCache,
    cacheStats,
    prefetchCards: async (queries: any[]) => {
      // Demo Mode: Pre-fetch common queries
      await Promise.all(queries.map(query => getCachedCards(query)));
    }
  };
};

/**
 * Hook for image optimization
 */
export const useImageOptimization = () => {
  const [optimizationStats, setOptimizationStats] = useState({
    totalImages: 0,
    optimizedImages: 0,
    bytesSaved: 0,
    isDemoMode: true
  });

  const optimizeImage = useCallback(async (file: File, options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'webp' | 'png';
  } = {}): Promise<{
    file: File;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
  }> => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            const result = {
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: blob.size,
              compressionRatio: (file.size - blob.size) / file.size
            };

            // Update stats
            setOptimizationStats(prev => ({
              ...prev,
              totalImages: prev.totalImages + 1,
              optimizedImages: prev.optimizedImages + 1,
              bytesSaved: prev.bytesSaved + (file.size - blob.size)
            }));

            resolve(result);
          } else {
            reject(new Error('Image optimization failed'));
          }
        }, `image/${format}`, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const getOptimizedImageUrl = useCallback((url: string, options: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}) => {
    // Demo Mode: Return original URL with params for demonstration
    // Alpha Testing: Would integrate with CDN/image service
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.quality) params.set('q', options.quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${params.toString() ? separator + params.toString() : ''}`;
  }, []);

  return {
    optimizeImage,
    getOptimizedImageUrl,
    optimizationStats,
    supportsWebP: () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  };
};
