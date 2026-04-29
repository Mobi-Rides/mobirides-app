/**
 * Unit tests for Promo Codes module
 * Tests promo code validation, discount calculation, and usage tracking
 * Reference: Tapologo test sheet cases PROMO-001 through PROMO-008
 */

import { validatePromoCode, calculateDiscount, applyPromoCode, getAvailablePromoCodes, PromoCode, PromoCodeValidation } from '@/services/promoCodeService';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('Promo Code Service', () => {
  const mockPromoCode: PromoCode = {
    id: 'promo-123',
    code: 'SAVE20',
    discount_amount: 20,
    discount_type: 'percentage',
    max_uses: 100,
    current_uses: 0,
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_until: '2026-12-31T23:59:59.999Z',
    is_active: true,
    description: '20% off on all bookings',
    terms_conditions: 'Valid for all users',
    min_booking_amount: 100,
    host_id: null,
    promo_code_cars: [],
  };

  const mockPromoCodeWithHost: PromoCode = {
    ...mockPromoCode,
    id: 'promo-host-456',
    code: 'HOST10',
    host_id: 'host-789',
    discount_amount: 10,
    discount_type: 'percentage',
  };

  const mockPromoCodeWithCars: PromoCode = {
    ...mockPromoCode,
    id: 'promo-car-789',
    code: 'CAR15',
    discount_amount: 15,
    promo_code_cars: [{ car_id: 'car-111' }],
  };

  const mockPromoCodeFixed: PromoCode = {
    ...mockPromoCode,
    id: 'promo-fixed-999',
    code: 'FIXED50',
    discount_amount: 50,
    discount_type: 'fixed',
  };

  const mockPromoCodeExpired: PromoCode = {
    ...mockPromoCode,
    id: 'promo-expired-000',
    code: 'EXPIRED',
    valid_until: '2025-12-31T23:59:59.999Z',
  };

  const mockPromoCodeNotYetValid: PromoCode = {
    ...mockPromoCode,
    id: 'promo-future-111',
    code: 'FUTURE',
    valid_from: '2027-01-01T00:00:00.000Z',
  };

  const mockPromoCodeInactive: PromoCode = {
    ...mockPromoCode,
    id: 'promo-inactive-222',
    code: 'INACTIVE',
    is_active: false,
  };

  const mockPromoCodeMaxUsesReached: PromoCode = {
    ...mockPromoCode,
    id: 'promo-max-333',
    code: 'MAXED',
    max_uses: 10,
    current_uses: 10,
  };

  const mockPromoCodeMinBooking: PromoCode = {
    ...mockPromoCode,
    id: 'promo-min-444',
    code: 'MIN1000',
    min_booking_amount: 1000,
  };

  // No beforeEach needed - each test sets up its own mocks

  describe('calculateDiscount', () => {
    it('PROMO-001: should calculate percentage discount correctly', () => {
      const discount = calculateDiscount(mockPromoCode, 500);
      expect(discount).toBe(100); // 20% of 500 = 100
    });

    it('PROMO-002: should calculate fixed discount correctly', () => {
      const discount = calculateDiscount(mockPromoCodeFixed, 500);
      expect(discount).toBe(50);
    });

    it('PROMO-003: should cap discount at booking amount for percentage', () => {
      const discount = calculateDiscount(mockPromoCode, 100);
      expect(discount).toBe(20); // 20% of 100 = 20, which is less than booking amount
    });

    it('PROMO-004: should cap discount at booking amount for fixed', () => {
      const discount = calculateDiscount(mockPromoCodeFixed, 30);
      expect(discount).toBe(30); // Discount capped at booking amount
    });
  });

  describe('validatePromoCode', () => {
    it('PROMO-001: should validate a valid promo code successfully', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'promo_codes') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockPromoCode, error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPromoCode, error: null }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('SAVE20', 'user-123', 500);

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(100);
      expect(result.promoCode).toEqual(mockPromoCode);
    });

    it('PROMO-002: should return invalid for non-existent promo code', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      });

      const result = await validatePromoCode('INVALID', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid promo code');
    });

    it('PROMO-003: should reject inactive promo code', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeInactive, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('INACTIVE', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code is inactive');
    });

    it('PROMO-004: should reject expired promo code', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeExpired, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('EXPIRED', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code has expired');
    });

    it('PROMO-005: should reject promo code not yet valid', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeNotYetValid, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('FUTURE', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code is not yet valid');
    });

    it('PROMO-006: should reject promo code when usage limit reached', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeMaxUsesReached, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('MAXED', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promo code usage limit reached');
    });

    it('PROMO-007: should reject when minimum booking amount not met', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeMinBooking, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('MIN1000', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Minimum booking amount');
    });

    it('PROMO-008: should reject if user already used the promo code', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'usage-123' }, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockPromoCode, error: null }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('SAVE20', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already used this promo code');
    });

    it('should validate promo code restricted to specific car', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'car-111', owner_id: 'host-123' }, 
                  error: null 
                }),
              }),
            }),
          };
        }
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: mockPromoCodeWithCars, 
                error: null 
              }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('CAR15', 'user-123', 500, 'car-111');

      expect(result.valid).toBe(true);
      expect(result.discount).toBe(75); // 15% of 500
    });

    it('should reject promo code for wrong car', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'car-999', owner_id: 'host-123' }, 
                  error: null 
                }),
              }),
            }),
          };
        }
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: mockPromoCodeWithCars, 
                error: null 
              }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('CAR15', 'user-123', 500, 'car-999');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is not valid for this vehicle');
    });

    it('should validate host-restricted promo code for correct host', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'car-111', owner_id: 'host-789' }, 
                  error: null 
                }),
              }),
            }),
          };
        }
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: mockPromoCodeWithHost, 
                error: null 
              }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('HOST10', 'user-123', 500, 'car-111');

      expect(result.valid).toBe(true);
    });

    it('should reject host-restricted promo code for wrong host', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'cars') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: { id: 'car-111', owner_id: 'host-999' }, 
                  error: null 
                }),
              }),
            }),
          };
        }
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: mockPromoCodeWithHost, 
                error: null 
              }),
            }),
          }),
        };
      });

      const result = await validatePromoCode('HOST10', 'user-123', 500, 'car-111');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is only valid for cars from a specific host');
    });

    it('should require carId for car-specific promo code', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPromoCodeWithCars, error: null }),
          }),
        }),
      });

      const result = await validatePromoCode('CAR15', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This promo code is restricted to specific cars');
    });

    it('should handle validation errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const result = await validatePromoCode('SAVE20', 'user-123', 500);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Failed to validate promo code');
    });
  });

  describe('applyPromoCode', () => {
    it('should apply promo code and create usage record', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

      await expect(applyPromoCode(
        'promo-123',
        'user-123',
        'booking-456',
        100,
        500,
        400
      )).resolves.not.toThrow();

      expect(supabase.from).toHaveBeenCalledWith('promo_code_usage');
      expect(supabase.rpc).toHaveBeenCalledWith('increment_promo_code_uses', { promo_id: 'promo-123' });
    });

    it('should throw error when insert fails', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
      });

      await expect(applyPromoCode(
        'promo-123',
        'user-123',
        'booking-456',
        100,
        500,
        400
      )).rejects.toThrow('Insert failed');
    });
  });

  describe('getAvailablePromoCodes', () => {
    it('should return available promo codes for user', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({ data: [mockPromoCode], error: null }),
            }),
          }),
        };
      });

      const result = await getAvailablePromoCodes('user-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockPromoCode);
    });

    it('should filter out already used promo codes', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'promo_code_usage') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [{ promo_code_id: 'promo-123' }],
                error: null
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gt: jest.fn().mockResolvedValue({
                data: [mockPromoCode],
                error: null
              }),
            }),
          }),
        };
      });

      const result = await getAvailablePromoCodes('user-123');

      expect(result).toHaveLength(0);
    });

    it('should return empty array on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gt: jest.fn().mockResolvedValue({ error: new Error('Database error') }),
          }),
        }),
      });

      const result = await getAvailablePromoCodes('user-123');

      expect(result).toEqual([]);
    });
  });
});
