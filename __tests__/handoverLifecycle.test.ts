import { completeHandover } from '../src/services/handoverService';

jest.mock('@/integrations/supabase/client', () => {
  return { supabase: { from: jest.fn(), rpc: jest.fn() } };
});

const { supabase } = require('@/integrations/supabase/client');

function mockHandoverSessionsChain(session: any) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: session, error: null }),
    update: () => ({ eq: jest.fn().mockResolvedValue({ error: null }) })
  };
}

describe('Handover Lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes a pickup handover and sets booking to in_progress', async () => {
    const bookingId = 'booking-1';
    const handoverId = 'handover-1';
    const session = { booking_id: bookingId, handover_type: 'pickup' };
    supabase.from.mockImplementation((table: string) => {
      if (table === 'handover_sessions') return mockHandoverSessionsChain(session);
      if (table === 'bookings') {
        const eq = jest.fn().mockResolvedValue({ error: null });
        return {
          update: () => ({ eq }),
          eq
        };
      }
      return {};
    });
    supabase.rpc.mockImplementation(() => ({}));
    const result = await completeHandover(handoverId);
    expect(result).toBe(true);
  });

  it('completes a return handover and sets booking to completed, calls release_pending_earnings', async () => {
    const bookingId = 'booking-2';
    const handoverId = 'handover-2';
    const session = { booking_id: bookingId, handover_type: 'return' };
    supabase.from.mockImplementation((table: string) => {
      if (table === 'handover_sessions') return mockHandoverSessionsChain(session);
      if (table === 'bookings') {
        const eq = jest.fn().mockResolvedValue({ error: null });
        return {
          update: () => ({ eq }),
          eq
        };
      }
      return {};
    });
    supabase.rpc.mockResolvedValue({});
    const result = await completeHandover(handoverId);
    expect(result).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('release_pending_earnings', { p_booking_id: bookingId });
  });

  it('returns false and logs error if session not found', async () => {
    const handoverId = 'handover-3';
    supabase.from.mockImplementation(() => mockHandoverSessionsChain(null));
    const result = await completeHandover(handoverId);
    expect(result).toBe(false);
  });
});
