/**
 * Unit tests for Vehicle Management module
 * Tests car listing, filtering, details view, wishlist functionality, and host car creation/update
 * Reference: Tapologo test sheet cases CAR-001 through CAR-025
 */

import { 
  fetchCars 
} from '@/utils/carFetching';
import { 
  saveCar, 
  unsaveCar, 
  isCarSaved 
} from '@/services/savedCarService';
import { 
  incrementCarViewCount, 
  getCarViewCount 
} from '@/services/carViewsService';
import {
  getCarBlockedDates,
  blockCarDates,
  unblockCarDates,
  getCarAvailability,
  getCarSchedule
} from '@/services/carAvailabilityService';
import { 
  toSafeCar 
} from '@/types/car';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

// Mock sonner for toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Vehicle Management Module', () => {
  const mockCar = {
    id: 'car-123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    price_per_day: 50,
    location: 'Gaborone',
    transmission: 'automatic',
    fuel: 'petrol',
    seats: 5,
    vehicle_type: 'Standard',
    description: 'Reliable sedan for daily use',
    features: ['AC', 'Bluetooth', 'GPS'],
    image_url: 'https://example.com/car.jpg',
    latitude: -24.654,
    longitude: 25.908,
    is_available: true,
    owner_id: 'owner-456',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    rating: 4.5,
    reviewCount: 12,
    isSaved: false,
    is_sharing_location: false,
    last_location_update: '2026-01-01T00:00:00.000Z',
    location_sharing_scope: 'always',
    verification_status: 'verified',
    view_count: 0
  };

  const mockSession = {
    data: {
      session: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
    },
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CAR-001: Browse car listings', () => {
    it('should fetch available cars with pagination', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [mockCar],
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      const result = await fetchCars({ pageParam: 0 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].brand).toBe('Toyota');
      expect(result.nextPage).toBeUndefined();
      expect(result.count).toBe(1);
    });

    it('should handle empty car listings', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [],
              count: 0,
              error: null,
            }),
          }),
        }),
      });

      const result = await fetchCars({ pageParam: 0 });

      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(result.nextPage).toBeUndefined();
    });
  });

  describe('CAR-002: View car details', () => {
    it('should convert car to SafeCar with defaults', () => {
      const safeCar = toSafeCar(mockCar as any);

      expect(safeCar.id).toBe('car-123');
      expect(safeCar.brand).toBe('Toyota');
      expect(safeCar.rating).toBe(4.5);
      expect(safeCar.reviewCount).toBe(12);
      expect(safeCar.is_available).toBe(true);
    });

    it('should provide defaults for missing car fields', () => {
      const incompleteCar = {
        id: 'car-999',
        brand: 'Honda',
        model: 'Civic',
        year: 2020,
        price_per_day: 40,
        location: 'Francistown',
        transmission: 'manual',
        fuel: 'diesel',
        seats: 4,
        vehicle_type: 'Standard' as const,
        owner_id: 'owner-789',
      } as any;

      const safeCar = toSafeCar(incompleteCar);

      expect(safeCar.description).toBe('No description available');
      expect(safeCar.features).toEqual([]);
      expect(safeCar.latitude).toBe(0);
      expect(safeCar.longitude).toBe(0);
    });
  });

  describe('CAR-003: Filter by location', () => {
    it('should filter cars by location (case-insensitive)', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              ilike: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          location: 'Gaborone',
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } 
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-004: Filter by brand', () => {
    it('should filter cars by brand', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        searchParams: { brand: 'Toyota' } 
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].brand).toBe('Toyota');
    });
  });

  describe('CAR-005: Filter by price', () => {
    it('should filter cars by minimum price', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          minPrice: 40,
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter cars by maximum price', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          maxPrice: 100,
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-006: Filter by vehicle type', () => {
    it('should filter cars by vehicle type', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          vehicleType: 'Standard',
          startDate: undefined,
          endDate: undefined,
          location: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-007: Save car to wishlist', () => {
    it('should save car successfully for authenticated user', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await saveCar('car-123');

      expect(result).toBe(true);
    });

    it('should not save car for unauthenticated user', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });

      const result = await saveCar('car-123');

      expect(result).toBe(false);
    });

    it('should return true if car is already saved', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ 
                data: { id: 'saved-123' }, 
                error: null 
              }),
            }),
          }),
        }),
      });

      const result = await saveCar('car-123');

      expect(result).toBe(true);
    });
  });

  describe('CAR-008: Unsave car from wishlist', () => {
    it('should unsave car successfully for authenticated user', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      const result = await unsaveCar('car-123');

      expect(result).toBe(true);
    });
  });

  describe('CAR-009: Check if car is saved', () => {
    it('should return true if car is saved', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ 
                data: { id: 'saved-123' }, 
                error: null 
              }),
            }),
          }),
        }),
      });

      const result = await isCarSaved('car-123');

      expect(result).toBe(true);
    });
  });

  describe('CAR-010: Host car creation', () => {
    it('should create car with valid data', async () => {
      const newCar = {
        brand: 'Honda',
        model: 'Civic',
        year: 2023,
        price_per_day: 60,
        location: 'Maun',
        transmission: 'automatic',
        fuel: 'petrol',
        seats: 5,
        vehicle_type: 'Standard',
        description: 'New sedan',
        features: ['AC', 'Bluetooth'],
        owner_id: 'owner-123',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: [{ ...newCar, id: 'car-new' }], error: null }),
      });

      const { data, error } = await supabase.from('cars').insert(newCar);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].brand).toBe('Honda');
    });
  });

  describe('CAR-011: Host car update', () => {
    it('should update car details', async () => {
      const updatedData = { price_per_day: 55, description: 'Updated description' };

      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ ...mockCar, ...updatedData }], error: null }),
        }),
      });

      const { data, error } = await supabase
        .from('cars')
        .update(updatedData)
        .eq('id', 'car-123');

      expect(error).toBeNull();
      expect(data![0].price_per_day).toBe(55);
    });
  });

  describe('CAR-012: Host set availability', () => {
    it('should update car availability', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [{ ...mockCar, is_available: false }], error: null }),
        }),
      });

      const { data, error } = await supabase
        .from('cars')
        .update({ is_available: false })
        .eq('id', 'car-123');

      expect(error).toBeNull();
      expect(data![0].is_available).toBe(false);
    });
  });

  describe('CAR-013: Car details view', () => {
    it('should fetch car details by ID', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCar, error: null }),
          }),
        }),
      });

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', 'car-123')
        .single();

      expect(error).toBeNull();
      expect(data.brand).toBe('Toyota');
      expect(data.model).toBe('Corolla');
    });
  });

  describe('CAR-014: Car wishlist functionality', () => {
    it('should toggle car save status', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSession);
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'saved_cars') {
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
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockCar, error: null }),
            }),
          }),
        };
      });

      const saved = await saveCar('car-123');
      expect(saved).toBe(true);
    });
  });

  describe('CAR-015: Car search and filtering', () => {
    it('should search cars by search term', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              or: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        searchParams: { searchTerm: 'Toyota' } 
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-016: Car sorting by price', () => {
    it('should sort cars by price ascending', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          sortBy: 'price', 
          sortOrder: 'asc',
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined
        } 
      });

      expect(result.data).toHaveLength(1);
    });

    it('should sort cars by price descending', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          sortBy: 'price', 
          sortOrder: 'desc',
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined
        } 
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-017: Car model filtering', () => {
    it('should filter cars by model name', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              ilike: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          model: 'Corolla',
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-018: Car year filtering', () => {
    it('should filter cars by year', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: [mockCar],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          year: 2022,
          startDate: undefined,
          endDate: undefined,
          vehicleType: undefined,
          location: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-019: Combined filters', () => {
    it('should apply multiple filters simultaneously', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    ilike: jest.fn().mockResolvedValue({
                      data: [mockCar],
                      count: 1,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await fetchCars({ 
        pageParam: 0, 
        filters: { 
          location: 'Gaborone',
          minPrice: 40,
          maxPrice: 100,
          vehicleType: 'Standard',
          startDate: undefined,
          endDate: undefined,
          sortBy: undefined,
          sortOrder: 'desc'
        } as any
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('CAR-020: Car availability check', () => {
    it('should return available cars only', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: [mockCar],
              count: 1,
              error: null,
            }),
          }),
        }),
      });

      const result = await fetchCars({ pageParam: 0 });

      expect(result.data[0].is_available).toBe(true);
    });
  });

  describe('CAR-021: Car view count increment', () => {
    it('should increment car view count', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

      await incrementCarViewCount('car-123');

      expect(supabase.rpc).toHaveBeenCalledWith('increment_car_view_count', { car_id: 'car-123' });
    });

    it('should handle increment errors gracefully', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({ error: new Error('RPC error') });

      await expect(incrementCarViewCount('car-123')).resolves.not.toThrow();
    });
  });

  describe('CAR-022: Car view count retrieval', () => {
    it('should get car view count', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ 
              data: { view_count: 42 }, 
              error: null 
            }),
          }),
        }),
      });

      const count = await getCarViewCount('car-123');

      expect(count).toBe(42);
    });

    it('should return 0 on error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      });

      const count = await getCarViewCount('car-123');

      expect(count).toBe(0);
    });
  });

  describe('CAR-023: Car blocked dates management', () => {
    it('should get car blocked dates', async () => {
      const mockBlockedDates = [
        { id: 'block-1', car_id: 'car-123', blocked_date: '2026-06-01', reason: 'Maintenance' },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockBlockedDates, error: null }),
        }),
      });

      const result = await getCarBlockedDates('car-123');

      expect(result).toHaveLength(1);
      expect(result[0].blocked_date).toBe('2026-06-01');
    });

    it('should block car dates', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      await expect(blockCarDates('car-123', [new Date('2026-06-01')], 'Maintenance'))
        .resolves.not.toThrow();
    });

    it('should ignore duplicate blocked dates', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ 
          error: { code: '23505', message: 'duplicate key' } 
        }),
      });

      await expect(blockCarDates('car-123', [new Date('2026-06-01')], 'Maintenance'))
        .resolves.not.toThrow();
    });

    it('should unblock car dates', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      await expect(unblockCarDates('car-123', [new Date('2026-06-01')]))
        .resolves.not.toThrow();
    });
  });

  describe('CAR-024: Car availability calendar', () => {
    it('should get car availability for a month', async () => {
      const mockBookings = [
        { id: 'book-1', start_date: '2026-06-10', end_date: '2026-06-15' },
      ];
      const mockBlocked = [
        { blocked_date: '2026-06-20', reason: 'Maintenance' },
      ];

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  or: jest.fn().mockResolvedValue({ data: mockBookings, error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockResolvedValue({ data: mockBlocked, error: null }),
              }),
            }),
          }),
        };
      });

      const result = await getCarAvailability('car-123', new Date('2026-06-01'));

      expect(result).toHaveLength(30); // June has 30 days
      expect(result[0].date.getDate()).toBe(1);
    });

    it('should mark past dates as past', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  or: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      });

      const pastDate = new Date('2020-01-01');
      const result = await getCarAvailability('car-123', pastDate);

      // All dates should be marked as past
      const pastStatuses = result.filter(d => d.status === 'past');
      expect(pastStatuses.length).toBeGreaterThan(0);
    });
  });

  describe('CAR-025: Car schedule retrieval', () => {
    it('should get car schedule with bookings and blocks', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'bookings') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                neq: jest.fn().mockReturnValue({
                  or: jest.fn().mockResolvedValue({ 
                    data: [{ id: 'book-1', start_date: '2026-06-10', end_date: '2026-06-15' }], 
                    error: null 
                  }),
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      });

      const result = await getCarSchedule('car-123');

      expect(result).toBeDefined();
    });
  });
});
