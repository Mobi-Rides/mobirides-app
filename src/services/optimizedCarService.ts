import { supabase } from '../integrations/supabase/client'
import { rateLimitService, enforceRateLimitByKey } from './rateLimitService'
import { captchaService, completeCaptchaFlowByKey } from './captchaService'
import { Car } from '../types/car'

export interface NearbyCarsParams {
  latitude: number
  longitude: number
  radiusKm?: number
  limit?: number
}

export interface CarSearchParams {
  latitude?: number
  longitude?: number
  radiusKm?: number
  brand?: string
  model?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  limit?: number
  offset?: number
}

export interface CarStats {
  totalCars: number
  activeCars: number
  verifiedCars: number
  averagePrice: number
  topBrands: Array<{ brand: string; count: number }>
}

class OptimizedCarService {
  private static instance: OptimizedCarService

  private constructor() {}

  static getInstance(): OptimizedCarService {
    if (!OptimizedCarService.instance) {
      OptimizedCarService.instance = new OptimizedCarService()
    }
    return OptimizedCarService.instance
  }

  /**
   * Get nearby cars using optimized database function
   */
  async getNearbyCars(params: NearbyCarsParams): Promise<Car[]> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('SEARCH_CARS')

      const { data, error } = await supabase.rpc('get_nearby_cars', {
        p_latitude: params.latitude,
        p_longitude: params.longitude,
        p_radius_km: params.radiusKm || 50,
        p_limit: params.limit || 20
      })

      if (error) {
        console.error('Error fetching nearby cars:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Optimized car service error:', error)
      throw error
    }
  }

  /**
   * Search cars with advanced filtering
   */
  async searchCars(params: CarSearchParams): Promise<{ cars: Car[]; total: number }> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('SEARCH_CARS')

      let query = supabase
        .from('cars')
        .select('*, profiles!inner(*)', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_verified', true)

      // Apply filters
      if (params.brand) {
        query = query.ilike('brand', `%${params.brand}%`)
      }

      if (params.model) {
        query = query.ilike('model', `%${params.model}%`)
      }

      if (params.minPrice !== undefined) {
        query = query.gte('price_per_day', params.minPrice)
      }

      if (params.maxPrice !== undefined) {
        query = query.lte('price_per_day', params.maxPrice)
      }

      if (params.minYear !== undefined) {
        query = query.gte('year', params.minYear)
      }

      if (params.maxYear !== undefined) {
        query = query.lte('year', params.maxYear)
      }

      // Apply location filter if provided
      if (params.latitude && params.longitude && params.radiusKm) {
        // Use the optimized nearby cars function for location-based search
        const nearbyCars = await this.getNearbyCars({
          latitude: params.latitude,
          longitude: params.longitude,
          radiusKm: params.radiusKm,
          limit: params.limit || 100
        })

        // Apply additional filters to nearby cars
        let filteredCars = nearbyCars

        if (params.brand) {
          filteredCars = filteredCars.filter(car => 
            car.brand.toLowerCase().includes(params.brand!.toLowerCase())
          )
        }

        if (params.model) {
          filteredCars = filteredCars.filter(car => 
            car.model.toLowerCase().includes(params.model!.toLowerCase())
          )
        }

        if (params.minPrice !== undefined) {
          filteredCars = filteredCars.filter(car => car.price_per_day >= params.minPrice!)
        }

        if (params.maxPrice !== undefined) {
          filteredCars = filteredCars.filter(car => car.price_per_day <= params.maxPrice!)
        }

        if (params.minYear !== undefined) {
          filteredCars = filteredCars.filter(car => car.year >= params.minYear!)
        }

        if (params.maxYear !== undefined) {
          filteredCars = filteredCars.filter(car => car.year <= params.maxYear!)
        }

        // Apply pagination
        const offset = params.offset || 0
        const limit = params.limit || 20
        const paginatedCars = filteredCars.slice(offset, offset + limit)

        return {
          cars: paginatedCars,
          total: filteredCars.length
        }
      }

      // Apply pagination
      if (params.offset) {
        query = query.range(params.offset, (params.offset + (params.limit || 20)) - 1)
      } else if (params.limit) {
        query = query.limit(params.limit)
      }

      // Execute query
      const { data, error, count } = await query

      if (error) {
        console.error('Error searching cars:', error)
        throw error
      }

      return {
        cars: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Car search error:', error)
      throw error
    }
  }

  /**
   * Get car details with optimized query
   */
  async getCarDetails(carId: string): Promise<Car | null> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('GET_CAR_DETAILS')

      const { data, error } = await supabase
        .from('cars')
        .select(`
          *,
          profiles!inner(*),
          bookings!inner(*)
        `)
        .eq('id', carId)
        .eq('is_active', true)
        .eq('is_verified', true)
        .single()

      if (error) {
        console.error('Error fetching car details:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Get car details error:', error)
      throw error
    }
  }

  /**
   * Add a new car with CAPTCHA verification
   */
  async addCar(carData: Partial<Car>): Promise<Car> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('ADD_CAR')

      // Verify CAPTCHA for high-risk action
      const captchaVerified = await completeCaptchaFlowByKey('ADD_CAR')
      if (!captchaVerified) {
        throw new Error('CAPTCHA verification failed')
      }

      // Validate car ownership (user can only add cars for themselves)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      const { data, error } = await supabase
        .from('cars')
        .insert({
          ...carData,
          host_id: user.id,
          is_active: false, // New cars start as inactive
          is_verified: false // New cars start as unverified
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding car:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Add car error:', error)
      throw error
    }
  }

  /**
   * Update car with ownership validation
   */
  async updateCar(carId: string, updates: Partial<Car>): Promise<Car> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('UPDATE_CAR')

      // Validate car ownership
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Check if user owns the car
      const { data: existingCar } = await supabase
        .from('cars')
        .select('host_id')
        .eq('id', carId)
        .single()

      if (!existingCar || existingCar.host_id !== user.id) {
        throw new Error('Unauthorized: You can only update your own cars')
      }

      const { data, error } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', carId)
        .select()
        .single()

      if (error) {
        console.error('Error updating car:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Update car error:', error)
      throw error
    }
  }

  /**
   * Delete car with CAPTCHA verification
   */
  async deleteCar(carId: string): Promise<void> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('DELETE_CAR')

      // Verify CAPTCHA for high-risk action
      const captchaVerified = await completeCaptchaFlowByKey('DELETE_CAR')
      if (!captchaVerified) {
        throw new Error('CAPTCHA verification failed')
      }

      // Validate car ownership
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Check if user owns the car
      const { data: existingCar } = await supabase
        .from('cars')
        .select('host_id')
        .eq('id', carId)
        .single()

      if (!existingCar || existingCar.host_id !== user.id) {
        throw new Error('Unauthorized: You can only delete your own cars')
      }

      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', carId)

      if (error) {
        console.error('Error deleting car:', error)
        throw error
      }
    } catch (error) {
      console.error('Delete car error:', error)
      throw error
    }
  }

  /**
   * Get car statistics
   */
  async getCarStats(): Promise<CarStats> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_CARS')

      // Get basic stats
      const { data: totalCars, error: totalError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })

      const { data: activeCars, error: activeError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { data: verifiedCars, error: verifiedError } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)

      // Get average price
      const { data: avgPriceData, error: avgPriceError } = await supabase
        .from('cars')
        .select('price_per_day')
        .eq('is_active', true)
        .eq('is_verified', true)

      // Get top brands
      const { data: brandData, error: brandError } = await supabase
        .from('cars')
        .select('brand')
        .eq('is_active', true)
        .eq('is_verified', true)

      if (totalError || activeError || verifiedError || avgPriceError || brandError) {
        throw new Error('Error fetching car statistics')
      }

      // Calculate average price
      const averagePrice = avgPriceData && avgPriceData.length > 0
        ? avgPriceData.reduce((sum, car) => sum + car.price_per_day, 0) / avgPriceData.length
        : 0

      // Calculate top brands
      const brandCounts = brandData?.reduce((acc, car) => {
        acc[car.brand] = (acc[car.brand] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      const topBrands = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        totalCars: totalCars || 0,
        activeCars: activeCars || 0,
        verifiedCars: verifiedCars || 0,
        averagePrice,
        topBrands
      }
    } catch (error) {
      console.error('Get car stats error:', error)
      throw error
    }
  }

  /**
   * Get user's cars with optimized query
   */
  async getUserCars(userId?: string): Promise<Car[]> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_CARS')

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        throw new Error('User ID is required')
      }

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('host_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user cars:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Get user cars error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const optimizedCarService = OptimizedCarService.getInstance() 