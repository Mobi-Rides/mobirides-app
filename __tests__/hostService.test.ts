/**
 * Unit tests for hostService
 */

import {
  getCurrentUserId,
  fetchOnlineHosts
} from '@/services/hostService';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('Host Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUserId', () => {
    it('should return user id from session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const id = await getCurrentUserId();
      expect(id).toBe('user-123');
    });

    it('should return null if no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const id = await getCurrentUserId();
      expect(id).toBeNull();
    });

    it('should return null on error', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Session error'));

      const id = await getCurrentUserId();
      expect(id).toBeNull();
    });
  });

  describe('fetchOnlineHosts', () => {
    const mockProfile = {
      id: 'host-123',
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
      latitude: -24.654,
      longitude: 25.908,
      updated_at: '2026-01-01T00:00:00.000Z',
      is_sharing_location: true
    };

    it('should fetch online hosts successfully', async () => {
      // Mock checkLocationColumns and fetchOnlineHosts query
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [mockProfile], error: null }),
              eq: jest.fn().mockReturnValue({
                not: jest.fn().mockReturnValue({
                  not: jest.fn().mockResolvedValue({ data: [mockProfile], error: null }),
                }),
              }),
            }),
          };
        }
      });

      const hosts = await fetchOnlineHosts();

      expect(hosts).toHaveLength(1);
      expect(hosts[0].full_name).toBe('John Doe');
    });

    it('should return empty array if columns do not exist', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }), // Missing location columns
        }),
      });

      const hosts = await fetchOnlineHosts();
      expect(hosts).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        }),
      });

      const hosts = await fetchOnlineHosts();
      expect(hosts).toEqual([]);
    });
  });
});
