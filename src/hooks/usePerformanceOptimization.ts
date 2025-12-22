import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface VirtualizationOptions {
  enabled: boolean;
  itemHeight: number;
  containerHeight: number;
  overscan: number;
}

export interface PerformanceOptions {
  enablePagination: boolean;
  enableVirtualization: boolean;
  enableDebouncing: boolean;
  enableMemoization: boolean;
  enableLazyLoading: boolean;
  debounceDelay: number;
  maxItemsPerPage: number;
  maxVisibleItems: number;
  enableCache: boolean;
  cacheTimeout: number; // minutes
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  total: number;
  filters: any;
}

export function usePerformanceOptimization<T>(
  fetchData: (options: any) => Promise<{ data: T[]; total: number }>,
  options: PerformanceOptions = {
    enablePagination: true,
    enableVirtualization: false,
    enableDebouncing: true,
    enableMemoization: true,
    enableLazyLoading: true,
    debounceDelay: 300,
    maxItemsPerPage: 50,
    maxVisibleItems: 1000,
    enableCache: true,
    cacheTimeout: 30
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: options.maxItemsPerPage,
    total: 0,
    hasMore: true
  });
  const [sort, setSort] = useState<SortOptions | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [virtualization, setVirtualization] = useState<VirtualizationOptions>({
    enabled: options.enableVirtualization,
    itemHeight: 60,
    containerHeight: 600,
    overscan: 5
  });

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const memoizedDataRef = useRef<Map<string, T[]>>(new Map());

  // Generate cache key
  const generateCacheKey = useCallback((filters: any, sort: any, page: number) => {
    return JSON.stringify({ filters, sort, page });
  }, []);

  // Check if cache is valid
  const isCacheValid = useCallback((timestamp: number) => {
    const now = Date.now();
    const timeout = options.cacheTimeout * 60 * 1000; // Convert minutes to milliseconds
    return now - timestamp < timeout;
  }, [options.cacheTimeout]);

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    const timeout = options.cacheTimeout * 60 * 1000;
    
    cacheRef.current.forEach((entry, key) => {
      if (now - entry.timestamp > timeout) {
        cacheRef.current.delete(key);
      }
    });
  }, [options.cacheTimeout]);

  // Memoization function
  const memoizeData = useCallback((key: string, data: T[]) => {
    if (options.enableMemoization) {
      memoizedDataRef.current.set(key, data);
    }
  }, [options.enableMemoization]);

  const getMemoizedData = useCallback((key: string) => {
    return options.enableMemoization ? memoizedDataRef.current.get(key) : undefined;
  }, [options.enableMemoization]);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(async (filters: any, sort: any, page: number, pageSize: number) => {
      try {
        // Check cache first
        if (options.enableCache) {
          const cacheKey = generateCacheKey(filters, sort, page);
          const cachedEntry = cacheRef.current.get(cacheKey);
          
          if (cachedEntry && isCacheValid(cachedEntry.timestamp) && 
              JSON.stringify(cachedEntry.filters) === JSON.stringify(filters)) {
            setData(cachedEntry.data);
            setPagination(prev => ({ ...prev, total: cachedEntry.total }));
            setLoading(false);
            return;
          }
        }

        // Abort previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const fetchOptions = {
          filters,
          sort,
          page,
          pageSize,
          signal: abortControllerRef.current.signal
        };

        const response = await fetchData(fetchOptions);
        
        if (response.data.length > options.maxVisibleItems) {
          response.data = response.data.slice(0, options.maxVisibleItems);
        }

        // Cache the results
        if (options.enableCache) {
          const cacheKey = generateCacheKey(filters, sort, page);
          cacheRef.current.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
            total: response.total,
            filters
          });
        }

        // Memoize data
        const memoKey = generateCacheKey(filters, sort, page);
        memoizeData(memoKey, response.data);

        setData(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.total,
          hasMore: response.data.length === pageSize
        }));
        
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    }, options.debounceDelay),
    [fetchData, options, generateCacheKey, isCacheValid, memoizeData]
  );

  // Main fetch function
  const fetchOptimizedData = useCallback(async (
    newFilters?: any,
    newSort?: SortOptions,
    newPage?: number
  ) => {
    const currentFilters = newFilters !== undefined ? newFilters : filters;
    const currentSort = newSort !== undefined ? newSort : sort;
    const currentPage = newPage !== undefined ? newPage : pagination.page;

    // Check memoized data first
    if (options.enableMemoization) {
      const memoKey = generateCacheKey(currentFilters, currentSort, currentPage);
      const memoizedData = getMemoizedData(memoKey);
      
      if (memoizedData) {
        setData(memoizedData);
        return;
      }
    }

    if (options.enableDebouncing) {
      debouncedFetch(currentFilters, currentSort, currentPage, pagination.pageSize);
    } else {
      // Direct fetch without debouncing
      try {
        setLoading(true);
        setError(null);

        const fetchOptions = {
          filters: currentFilters,
          sort: currentSort,
          page: currentPage,
          pageSize: pagination.pageSize
        };

        const response = await fetchData(fetchOptions);
        
        if (response.data.length > options.maxVisibleItems) {
          response.data = response.data.slice(0, options.maxVisibleItems);
        }

        setData(response.data);
        setPagination(prev => ({
          ...prev,
          total: response.total,
          hasMore: response.data.length === pagination.pageSize
        }));
        
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
  }, [filters, sort, pagination, options, debouncedFetch, generateCacheKey, getMemoizedData]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    if (page < 1) return;
    if (options.enablePagination && page > Math.ceil(pagination.total / pagination.pageSize)) return;
    
    setPagination(prev => ({ ...prev, page }));
    fetchOptimizedData(filters, sort, page);
  }, [filters, sort, pagination, options.enablePagination, fetchOptimizedData]);

  const nextPage = useCallback(() => {
    goToPage(pagination.page + 1);
  }, [pagination.page, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(pagination.page - 1);
  }, [pagination.page, goToPage]);

  const changePageSize = useCallback((pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, page: 1 }));
    fetchOptimizedData(filters, sort, 1);
  }, [filters, sort, fetchOptimizedData]);

  // Sort handlers
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    const newSort = { field, direction };
    setSort(newSort);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOptimizedData(filters, newSort, 1);
  }, [filters, fetchOptimizedData]);

  // Filter handlers
  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOptimizedData(newFilters, sort, 1);
  }, [sort, fetchOptimizedData]);

  // Lazy loading for infinite scroll
  const loadMore = useCallback(async () => {
    if (!options.enableLazyLoading || loading || !pagination.hasMore) return;
    
    const nextPage = pagination.page + 1;
    try {
      const response = await fetchData({
        filters,
        sort,
        page: nextPage,
        pageSize: pagination.pageSize
      });
      
      setData(prev => [...prev, ...response.data]);
      setPagination(prev => ({
        ...prev,
        page: nextPage,
        hasMore: response.data.length === pagination.pageSize
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to load more data');
    }
  }, [filters, sort, pagination, options.enableLazyLoading, loading, fetchData]);

  // Virtualization calculations
  const getVirtualizedItems = useCallback((scrollTop: number) => {
    if (!virtualization.enabled) return { startIndex: 0, endIndex: data.length };
    
    const { itemHeight, containerHeight, overscan } = virtualization;
    const startIndex = Math.floor(scrollTop / itemHeight) - overscan;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = startIndex + visibleCount + overscan * 2;
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex: Math.min(data.length, endIndex)
    };
  }, [data.length, virtualization]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cacheRef.current.clear();
    memoizedDataRef.current.clear();
  }, []);

  // Auto cleanup expired cache
  useEffect(() => {
    if (options.enableCache) {
      const interval = setInterval(clearExpiredCache, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [clearExpiredCache, options.enableCache]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    data,
    loading,
    error,
    pagination,
    sort,
    filters,
    virtualization,
    
    // Actions
    fetchData: fetchOptimizedData,
    goToPage,
    nextPage,
    previousPage,
    changePageSize,
    handleSort,
    handleFilterChange,
    loadMore,
    getVirtualizedItems,
    setVirtualization,
    cleanup,
    
    // Utility functions
    clearCache: () => cacheRef.current.clear(),
    clearMemoization: () => memoizedDataRef.current.clear(),
    getCacheSize: () => cacheRef.current.size,
    getMemoizationSize: () => memoizedDataRef.current.size
  };
}