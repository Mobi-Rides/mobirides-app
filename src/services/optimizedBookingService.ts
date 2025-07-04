import { supabase } from '../integrations/supabase/client'
import { rateLimitService, enforceRateLimitByKey } from './rateLimitService'
import { captchaService, completeCaptchaFlowByKey } from './captchaService'
import { Booking } from '../types/booking'

export interface BookingStats {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  totalSpent: number
  averageRating: number
}

export interface CreateBookingParams {
  carId: string
  startDate: string
  endDate: string
  totalPrice: number
  guestNotes?: string
}

class OptimizedBookingService {
  private static instance: OptimizedBookingService

  private constructor() {}

  static getInstance(): OptimizedBookingService {
    if (!OptimizedBookingService.instance) {
      OptimizedBookingService.instance = new OptimizedBookingService()
    }
    return OptimizedBookingService.instance
  }

  /**
   * Create a new booking with CAPTCHA verification
   */
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('CREATE_BOOKING')

      // Verify CAPTCHA for high-risk action
      const captchaVerified = await completeCaptchaFlowByKey('CREATE_BOOKING')
      if (!captchaVerified) {
        throw new Error('CAPTCHA verification failed')
      }

      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Validate car exists and is available
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('host_id, is_active, is_verified')
        .eq('id', params.carId)
        .single()

      if (carError || !car) {
        throw new Error('Car not found')
      }

      if (!car.is_active || !car.is_verified) {
        throw new Error('Car is not available for booking')
      }

      if (car.host_id === user.id) {
        throw new Error('You cannot book your own car')
      }

      // Check for date conflicts
      const { data: conflictingBookings, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('car_id', params.carId)
        .eq('status', 'confirmed')
        .or(`start_date.lte.${params.endDate},end_date.gte.${params.startDate}`)

      if (conflictError) {
        console.error('Error checking booking conflicts:', conflictError)
        throw new Error('Error checking booking availability')
      }

      if (conflictingBookings && conflictingBookings.length > 0) {
        throw new Error('Car is not available for the selected dates')
      }

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          car_id: params.carId,
          guest_id: user.id,
          host_id: car.host_id,
          start_date: params.startDate,
          end_date: params.endDate,
          total_price: params.totalPrice,
          guest_notes: params.guestNotes,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating booking:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Create booking error:', error)
      throw error
    }
  }

  /**
   * Get user's booking statistics
   */
  async getUserBookingStats(userId?: string): Promise<BookingStats> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_BOOKINGS')

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        throw new Error('User ID is required')
      }

      const { data, error } = await supabase.rpc('get_user_booking_stats', {
        p_user_id: targetUserId
      })

      if (error) {
        console.error('Error fetching booking stats:', error)
        throw error
      }

      return data || {
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
        averageRating: 0
      }
    } catch (error) {
      console.error('Get booking stats error:', error)
      throw error
    }
  }

  /**
   * Get user's bookings with optimized query
   */
  async getUserBookings(userId?: string, status?: string): Promise<Booking[]> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_BOOKINGS')

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (!targetUserId) {
        throw new Error('User ID is required')
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          cars!inner(*),
          profiles!bookings_guest_id_fkey(*),
          profiles!bookings_host_id_fkey(*)
        `)
        .or(`guest_id.eq.${targetUserId},host_id.eq.${targetUserId}`)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching user bookings:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Get user bookings error:', error)
      throw error
    }
  }

  /**
   * Update booking status with validation
   */
  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('UPDATE_BOOKING')

      // Validate booking access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Check if user has access to this booking
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('guest_id, host_id, status')
        .eq('id', bookingId)
        .single()

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      if (existingBooking.guest_id !== user.id && existingBooking.host_id !== user.id) {
        throw new Error('Unauthorized: You can only update your own bookings')
      }

      // Validate status transition
      const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
        completed: [],
        cancelled: []
      }

      const allowedStatuses = validTransitions[existingBooking.status as keyof typeof validTransitions] || []
      if (!allowedStatuses.includes(status)) {
        throw new Error(`Invalid status transition from ${existingBooking.status} to ${status}`)
      }

      // Update booking
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Error updating booking status:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Update booking status error:', error)
      throw error
    }
  }

  /**
   * Cancel booking with CAPTCHA verification
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<Booking> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('CANCEL_BOOKING')

      // Verify CAPTCHA for high-risk action
      const captchaVerified = await completeCaptchaFlowByKey('CANCEL_BOOKING')
      if (!captchaVerified) {
        throw new Error('CAPTCHA verification failed')
      }

      // Validate booking access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Check if user has access to this booking
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('guest_id, host_id, status, start_date')
        .eq('id', bookingId)
        .single()

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      if (existingBooking.guest_id !== user.id && existingBooking.host_id !== user.id) {
        throw new Error('Unauthorized: You can only cancel your own bookings')
      }

      // Check if booking can be cancelled
      if (existingBooking.status === 'cancelled') {
        throw new Error('Booking is already cancelled')
      }

      if (existingBooking.status === 'completed') {
        throw new Error('Cannot cancel completed booking')
      }

      // Check if booking is too close to start date
      const startDate = new Date(existingBooking.start_date)
      const now = new Date()
      const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilStart < 24) {
        throw new Error('Cannot cancel booking within 24 hours of start date')
      }

      // Update booking
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Error cancelling booking:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Cancel booking error:', error)
      throw error
    }
  }

  /**
   * Get booking details with optimized query
   */
  async getBookingDetails(bookingId: string): Promise<Booking | null> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_BOOKINGS')

      // Validate booking access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars!inner(*),
          profiles!bookings_guest_id_fkey(*),
          profiles!bookings_host_id_fkey(*)
        `)
        .eq('id', bookingId)
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
        .single()

      if (error) {
        console.error('Error fetching booking details:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Get booking details error:', error)
      throw error
    }
  }

  /**
   * Get upcoming bookings for a car
   */
  async getCarUpcomingBookings(carId: string): Promise<Booking[]> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('API_BOOKINGS')

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_guest_id_fkey(*)
        `)
        .eq('car_id', carId)
        .eq('status', 'confirmed')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching car upcoming bookings:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Get car upcoming bookings error:', error)
      throw error
    }
  }

  /**
   * Rate a completed booking
   */
  async rateBooking(bookingId: string, rating: number, review?: string): Promise<Booking> {
    try {
      // Check rate limit
      await enforceRateLimitByKey('UPDATE_BOOKING')

      // Validate booking access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User must be authenticated')
      }

      // Check if user has access to this booking
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('guest_id, host_id, status, rating')
        .eq('id', bookingId)
        .single()

      if (!existingBooking) {
        throw new Error('Booking not found')
      }

      if (existingBooking.guest_id !== user.id && existingBooking.host_id !== user.id) {
        throw new Error('Unauthorized: You can only rate your own bookings')
      }

      // Check if booking is completed
      if (existingBooking.status !== 'completed') {
        throw new Error('Can only rate completed bookings')
      }

      // Check if already rated
      if (existingBooking.rating) {
        throw new Error('Booking has already been rated')
      }

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      // Update booking
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          rating,
          review
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) {
        console.error('Error rating booking:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Rate booking error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const optimizedBookingService = OptimizedBookingService.getInstance() 