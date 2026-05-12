/**
 * Unit tests for Reviews & Ratings module
 * Tests review submission, host response, and rating calculations
 * Reference: Tapologo test sheet cases REV-001 through REV-008
 */

import {
  submitReview,
  submitHostResponse,
  calculateAverageRating,
  getCarReviews
} from '@/services/reviewService';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('Review Service', () => {
  const mockReview = {
    id: 'rev-123',
    car_id: 'car-123',
    reviewer_id: 'renter-123',
    reviewee_id: 'host-123',
    booking_id: 'book-123',
    rating: 5,
    comment: 'Great car!',
    review_type: 'car',
    status: 'published',
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
  };

  const mockBooking = {
    id: 'book-123',
    status: 'completed',
    renter_id: 'renter-123',
    car_id: 'car-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('REV-001 & REV-003: Review submission', () => {
    it('should submit a valid review successfully', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          };
        }
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'book-123',
        rating: 5,
        comment: 'Excellent service!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('REV-002: Category ratings', () => {
    it('should submit review with category ratings', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: jest.fn().mockImplementation((data) => {
              expect(data.category_ratings).toEqual({ Cleanliness: 5, Communication: 4 });
              return Promise.resolve({ error: null });
            }),
          };
        }
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'book-123',
        rating: 4.5,
        comment: 'Very clean!',
        categoryRatings: { Cleanliness: 5, Communication: 4 }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('REV-004: Host response', () => {
    it('should allow host to respond to a review', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { reviewee_id: 'host-123' }, 
                  error: null 
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
      });

      const result = await submitHostResponse('rev-123', 'host-123', 'Thank you for your review!');

      expect(result.success).toBe(true);
    });

    it('should reject response from non-host user', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { reviewee_id: 'host-123' }, 
                  error: null 
                }),
              }),
            }),
          };
        }
      });

      const result = await submitHostResponse('rev-123', 'attacker-123', 'I am not the host');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the host can respond to this review');
    });
  });

  describe('REV-005: View car reviews', () => {
    it('should fetch published reviews for a car', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ 
                data: [mockReview], 
                error: null 
              }),
            }),
          }),
        }),
      });

      const result = await getCarReviews('car-123');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rev-123');
    });
  });

  describe('REV-006: Average rating display', () => {
    it('should calculate correct average rating', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];
      const avg = calculateAverageRating(reviews);
      expect(avg).toBe(4.0);
    });

    it('should handle decimal ratings correctly', () => {
      const reviews = [
        { rating: 5 },
        { rating: 4.5 },
      ];
      const avg = calculateAverageRating(reviews);
      expect(avg).toBe(4.8); // (5 + 4.5) / 2 = 4.75 -> 4.8
    });

    it('should return 0 for no reviews', () => {
      expect(calculateAverageRating([])).toBe(0);
    });
  });

  describe('REV-007: Cannot review twice', () => {
    it('should reject duplicate review for same booking', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ 
                    data: { id: 'existing-rev' }, 
                    error: null 
                  }),
                }),
              }),
            }),
          };
        }
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'book-123',
        rating: 5,
        comment: 'Trying to review again',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You have already reviewed this booking');
    });
  });

  describe('REV-008: Review before rental', () => {
    it('should reject review for non-completed booking', async () => {
      const activeBooking = { ...mockBooking, status: 'confirmed' };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: activeBooking, error: null }),
          }),
        }),
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'book-active',
        rating: 5,
        comment: 'Too early!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You can only review completed bookings');
    });
  });

  describe('Error paths and edge cases', () => {
    it('should handle booking not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'invalid-book',
        rating: 5,
        comment: 'Wait',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Booking not found');
    });

    it('should reject review from wrong user', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
          }),
        }),
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'wrong-user',
        revieweeId: 'host-123',
        bookingId: 'book-123',
        rating: 5,
        comment: 'Stealing review',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only the renter can review this booking');
    });

    it('should handle insert errors', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockBooking, error: null }),
              }),
            }),
          };
        }
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
            insert: jest.fn().mockResolvedValue({ error: { message: 'Insert failed' } }),
          };
        }
      });

      const result = await submitReview({
        carId: 'car-123',
        reviewerId: 'renter-123',
        revieweeId: 'host-123',
        bookingId: 'book-123',
        rating: 5,
        comment: 'Boom',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to submit review');
    });

    it('should handle host response review not found', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await submitHostResponse('invalid-rev', 'host-123', 'Hi');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Review not found');
    });

    it('should handle host response update error', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'reviews') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { reviewee_id: 'host-123' }, 
                  error: null 
                }),
              }),
            }),
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
            }),
          };
        }
      });

      const result = await submitHostResponse('rev-123', 'host-123', 'Fail');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to submit response');
    });

    it('should handle get reviews error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Fetch failed' } }),
            }),
          }),
        }),
      });

      const result = await getCarReviews('car-123');

      expect(result).toEqual([]);
    });
  });
});
