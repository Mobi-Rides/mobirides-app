import { supabase } from '../integrations/supabase/client'

export interface QueryPerformanceMetrics {
  queryId: string
  endpoint: string
  executionTime: number
  timestamp: Date
  success: boolean
  errorMessage?: string
  userId?: string
  ipAddress?: string
}

export interface SystemMetrics {
  activeConnections: number
  cacheHitRate: number
  averageResponseTime: number
  errorRate: number
  requestsPerMinute: number
}

export interface DatabaseMetrics {
  slowQueries: Array<{
    query: string
    executionTime: number
    timestamp: Date
    frequency: number
  }>
  indexUsage: Array<{
    indexName: string
    tableName: string
    scans: number
    lastUsed: Date
  }>
  tableSizes: Array<{
    tableName: string
    size: string
    rowCount: number
  }>
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService
  private metrics: QueryPerformanceMetrics[] = []
  private readonly MAX_METRICS = 1000 // Keep last 1000 metrics in memory

  private constructor() {}

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService()
    }
    return PerformanceMonitoringService.instance
  }

  /**
   * Track query performance
   */
  trackQueryPerformance(
    queryId: string,
    endpoint: string,
    executionTime: number,
    success: boolean,
    errorMessage?: string,
    userId?: string,
    ipAddress?: string
  ): void {
    const metric: QueryPerformanceMetrics = {
      queryId,
      endpoint,
      executionTime,
      timestamp: new Date(),
      success,
      errorMessage,
      userId,
      ipAddress
    }

    this.metrics.push(metric)

    // Keep only the last MAX_METRICS
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }

    // Log slow queries (over 1 second)
    if (executionTime > 1000) {
      console.warn(`Slow query detected: ${endpoint} took ${executionTime}ms`, {
        queryId,
        userId,
        ipAddress,
        errorMessage
      })
    }

    // Log failed queries
    if (!success) {
      console.error(`Query failed: ${endpoint}`, {
        queryId,
        userId,
        ipAddress,
        errorMessage,
        executionTime
      })
    }
  }

  /**
   * Get performance metrics for a time period
   */
  getMetrics(timeWindowMinutes: number = 60): QueryPerformanceMetrics[] {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    return this.metrics.filter(metric => metric.timestamp > cutoffTime)
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const recentMetrics = this.getMetrics(5) // Last 5 minutes
    const totalRequests = recentMetrics.length
    const successfulRequests = recentMetrics.filter(m => m.success).length
    const failedRequests = totalRequests - successfulRequests

    const averageResponseTime = totalRequests > 0
      ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalRequests
      : 0

    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0
    const requestsPerMinute = totalRequests / 5 // 5-minute window

    return {
      activeConnections: this.getActiveConnections(),
      cacheHitRate: this.getCacheHitRate(),
      averageResponseTime,
      errorRate,
      requestsPerMinute
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(): Promise<DatabaseMetrics> {
    try {
      // Get slow queries from database (if pg_stat_statements is available)
      const { data: slowQueries, error: slowQueriesError } = await supabase.rpc('get_slow_queries', {
        p_min_execution_time: 1000 // 1 second
      })

      // Get index usage statistics
      const { data: indexUsage, error: indexUsageError } = await supabase.rpc('get_index_usage_stats')

      // Get table sizes
      const { data: tableSizes, error: tableSizesError } = await supabase.rpc('get_table_sizes')

      return {
        slowQueries: slowQueries || [],
        indexUsage: indexUsage || [],
        tableSizes: tableSizes || []
      }
    } catch (error) {
      console.error('Error fetching database metrics:', error)
      return {
        slowQueries: [],
        indexUsage: [],
        tableSizes: []
      }
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalQueries: number
    averageResponseTime: number
    errorRate: number
    slowQueries: number
    topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>
  } {
    const recentMetrics = this.getMetrics(60) // Last hour
    const totalQueries = recentMetrics.length

    if (totalQueries === 0) {
      return {
        totalQueries: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowQueries: 0,
        topEndpoints: []
      }
    }

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
    const errorRate = (recentMetrics.filter(m => !m.success).length / totalQueries) * 100
    const slowQueries = recentMetrics.filter(m => m.executionTime > 1000).length

    // Group by endpoint
    const endpointStats = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = { count: 0, totalTime: 0 }
      }
      acc[metric.endpoint].count++
      acc[metric.endpoint].totalTime += metric.executionTime
      return acc
    }, {} as Record<string, { count: number; totalTime: number }>)

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalQueries,
      averageResponseTime,
      errorRate,
      slowQueries,
      topEndpoints
    }
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(hoursToKeep: number = 24): void {
    const cutoffTime = new Date(Date.now() - hoursToKeep * 60 * 60 * 1000)
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime)
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): QueryPerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get active connections (simulated)
   */
  private getActiveConnections(): number {
    // This would typically come from database monitoring
    // For now, return a simulated value
    return Math.floor(Math.random() * 50) + 10
  }

  /**
   * Get cache hit rate (simulated)
   */
  private getCacheHitRate(): number {
    // This would typically come from cache monitoring
    // For now, return a simulated value
    return Math.random() * 30 + 70 // 70-100%
  }

  /**
   * Monitor a function execution
   */
  async monitorFunction<T>(
    functionName: string,
    fn: () => Promise<T>,
    userId?: string,
    ipAddress?: string
  ): Promise<T> {
    const startTime = Date.now()
    const queryId = `${functionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    try {
      const result = await fn()
      const executionTime = Date.now() - startTime

      this.trackQueryPerformance(
        queryId,
        functionName,
        executionTime,
        true,
        undefined,
        userId,
        ipAddress
      )

      return result
    } catch (error) {
      const executionTime = Date.now() - startTime

      this.trackQueryPerformance(
        queryId,
        functionName,
        executionTime,
        false,
        error instanceof Error ? error.message : String(error),
        userId,
        ipAddress
      )

      throw error
    }
  }

  /**
   * Get alerts for performance issues
   */
  getAlerts(): Array<{
    type: 'slow_query' | 'high_error_rate' | 'high_latency' | 'low_cache_hit'
    message: string
    severity: 'low' | 'medium' | 'high'
    timestamp: Date
  }> {
    const alerts: Array<{
      type: 'slow_query' | 'high_error_rate' | 'high_latency' | 'low_cache_hit'
      message: string
      severity: 'low' | 'medium' | 'high'
      timestamp: Date
    }> = []

    const recentMetrics = this.getMetrics(5) // Last 5 minutes
    const totalRequests = recentMetrics.length

    if (totalRequests === 0) return alerts

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalRequests
    const errorRate = (recentMetrics.filter(m => !m.success).length / totalRequests) * 100
    const slowQueries = recentMetrics.filter(m => m.executionTime > 1000).length

    // High error rate alert
    if (errorRate > 10) {
      alerts.push({
        type: 'high_error_rate',
        message: `High error rate detected: ${errorRate.toFixed(1)}%`,
        severity: errorRate > 20 ? 'high' : 'medium',
        timestamp: new Date()
      })
    }

    // High latency alert
    if (averageResponseTime > 2000) {
      alerts.push({
        type: 'high_latency',
        message: `High average response time: ${averageResponseTime.toFixed(0)}ms`,
        severity: averageResponseTime > 5000 ? 'high' : 'medium',
        timestamp: new Date()
      })
    }

    // Slow queries alert
    if (slowQueries > 5) {
      alerts.push({
        type: 'slow_query',
        message: `${slowQueries} slow queries detected in the last 5 minutes`,
        severity: slowQueries > 10 ? 'high' : 'medium',
        timestamp: new Date()
      })
    }

    return alerts
  }
}

// Export singleton instance
export const performanceMonitoringService = PerformanceMonitoringService.getInstance()

// Helper function to monitor any async function
export function withPerformanceMonitoring<T>(
  functionName: string,
  fn: () => Promise<T>,
  userId?: string,
  ipAddress?: string
): Promise<T> {
  return performanceMonitoringService.monitorFunction(functionName, fn, userId, ipAddress)
}

// Performance monitoring decorator for class methods
export function monitorPerformance(functionName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const name = functionName || `${target.constructor.name}.${propertyName}`
      return performanceMonitoringService.monitorFunction(name, () => method.apply(this, args))
    }
  }
} 