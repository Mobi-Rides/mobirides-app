import { supabase } from '../integrations/supabase/client'

export interface RateLimitConfig {
  endpoint: string
  maxRequests?: number
  windowMinutes?: number
}

export interface RateLimitResponse {
  allowed: boolean
  endpoint: string
  ipAddress: string
  userId?: string
}

class RateLimitService {
  private static instance: RateLimitService
  private cache = new Map<string, { allowed: boolean; timestamp: number }>()
  private readonly CACHE_DURATION = 5000 // 5 seconds

  private constructor() {}

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService()
    }
    return RateLimitService.instance
  }

  /**
   * Check if a request is allowed based on rate limits
   */
  async checkRateLimit(config: RateLimitConfig): Promise<RateLimitResponse> {
    const cacheKey = `${config.endpoint}-${config.maxRequests}-${config.windowMinutes}`
    const cached = this.cache.get(cacheKey)
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        allowed: cached.allowed,
        endpoint: config.endpoint,
        ipAddress: 'cached',
        userId: undefined
      }
    }

    try {
      // Call the rate limit edge function
      const { data, error } = await supabase.functions.invoke('rate-limit-check', {
        body: {
          endpoint: config.endpoint,
          maxRequests: config.maxRequests || 100,
          windowMinutes: config.windowMinutes || 15
        }
      })

      if (error) {
        console.error('Rate limit check error:', error)
        // Default to allowing if rate limit check fails
        return {
          allowed: true,
          endpoint: config.endpoint,
          ipAddress: 'unknown',
          userId: undefined
        }
      }

      const response = data as RateLimitResponse
      
      // Cache the result
      this.cache.set(cacheKey, {
        allowed: response.allowed,
        timestamp: Date.now()
      })

      return response
    } catch (error) {
      console.error('Rate limit service error:', error)
      // Default to allowing if service fails
      return {
        allowed: true,
        endpoint: config.endpoint,
        ipAddress: 'unknown',
        userId: undefined
      }
    }
  }

  /**
   * Check rate limit and throw error if exceeded
   */
  async enforceRateLimit(config: RateLimitConfig): Promise<void> {
    const result = await this.checkRateLimit(config)
    
    if (!result.allowed) {
      throw new Error(`Rate limit exceeded for endpoint: ${config.endpoint}`)
    }
  }

  /**
   * Clear cache for a specific endpoint
   */
  clearCache(endpoint?: string): void {
    if (endpoint) {
      // Clear specific endpoint cache
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpoint)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.cache.clear()
    }
  }

  /**
   * Get rate limit status for monitoring
   */
  getCacheStatus(): { size: number; entries: Array<{ key: string; timestamp: number }> } {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp
    }))

    return {
      size: this.cache.size,
      entries
    }
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance()

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  SIGN_UP: { endpoint: 'auth/signup', maxRequests: 5, windowMinutes: 15 },
  SIGN_IN: { endpoint: 'auth/signin', maxRequests: 10, windowMinutes: 15 },
  PASSWORD_RESET: { endpoint: 'auth/password-reset', maxRequests: 3, windowMinutes: 60 },
  
  // Car operations
  ADD_CAR: { endpoint: 'cars/add', maxRequests: 10, windowMinutes: 60 },
  UPDATE_CAR: { endpoint: 'cars/update', maxRequests: 20, windowMinutes: 15 },
  DELETE_CAR: { endpoint: 'cars/delete', maxRequests: 5, windowMinutes: 60 },
  
  // Booking operations
  CREATE_BOOKING: { endpoint: 'bookings/create', maxRequests: 10, windowMinutes: 15 },
  UPDATE_BOOKING: { endpoint: 'bookings/update', maxRequests: 20, windowMinutes: 15 },
  CANCEL_BOOKING: { endpoint: 'bookings/cancel', maxRequests: 5, windowMinutes: 15 },
  
  // Search and listing
  SEARCH_CARS: { endpoint: 'cars/search', maxRequests: 100, windowMinutes: 15 },
  GET_CAR_DETAILS: { endpoint: 'cars/details', maxRequests: 200, windowMinutes: 15 },
  
  // Profile operations
  UPDATE_PROFILE: { endpoint: 'profile/update', maxRequests: 20, windowMinutes: 15 },
  UPLOAD_AVATAR: { endpoint: 'profile/avatar', maxRequests: 10, windowMinutes: 15 },
  
  // Messaging
  SEND_MESSAGE: { endpoint: 'messages/send', maxRequests: 50, windowMinutes: 15 },
  
  // Payment operations
  CREATE_PAYMENT: { endpoint: 'payments/create', maxRequests: 10, windowMinutes: 15 },
  
  // API endpoints
  API_CARS: { endpoint: 'api/cars', maxRequests: 1000, windowMinutes: 15 },
  API_BOOKINGS: { endpoint: 'api/bookings', maxRequests: 500, windowMinutes: 15 },
  API_PROFILES: { endpoint: 'api/profiles', maxRequests: 200, windowMinutes: 15 }
} as const

// Helper function to get rate limit config by key
export function getRateLimitConfig(key: keyof typeof RATE_LIMIT_CONFIGS): RateLimitConfig {
  return RATE_LIMIT_CONFIGS[key]
}

// Helper function to check rate limit with predefined config
export async function checkRateLimitByKey(key: keyof typeof RATE_LIMIT_CONFIGS): Promise<RateLimitResponse> {
  return rateLimitService.checkRateLimit(getRateLimitConfig(key))
}

// Helper function to enforce rate limit with predefined config
export async function enforceRateLimitByKey(key: keyof typeof RATE_LIMIT_CONFIGS): Promise<void> {
  return rateLimitService.enforceRateLimit(getRateLimitConfig(key))
} 