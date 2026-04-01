jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/commission/commissionRates', () => ({
  getCurrentCommissionRate: jest.fn(),
}));

import { supabase } from '@/integrations/supabase/client';
import { getCurrentCommissionRate } from '@/services/commission/commissionRates';
import { checkHostCanAcceptBooking } from '@/services/commission/walletValidation';

describe('checkHostCanAcceptBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows booking acceptance when wallet balance is sufficient', async () => {
    (getCurrentCommissionRate as jest.Mock).mockResolvedValue(0.1);

    const single = jest.fn().mockResolvedValue({ data: { balance: 65 }, error: null });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await checkHostCanAcceptBooking('host-1', 100);

    expect(result.canAccept).toBe(true);
    expect(result.currentBalance).toBe(65);
    expect(result.commissionAmount).toBe(10);
    expect(result.message).toBeUndefined();
  });

  it('returns actionable message when balance is insufficient', async () => {
    (getCurrentCommissionRate as jest.Mock).mockResolvedValue(0.1);

    const single = jest.fn().mockResolvedValue({ data: { balance: 40 }, error: null });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await checkHostCanAcceptBooking('host-1', 100);

    expect(result.canAccept).toBe(false);
    expect(result.message).toContain('Insufficient wallet balance');
    expect(result.message).toContain('P60.00');
  });

  it('returns wallet not found message when wallet query errors', async () => {
    (getCurrentCommissionRate as jest.Mock).mockResolvedValue(0.12);

    const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
    const eq = jest.fn().mockReturnValue({ single });
    const select = jest.fn().mockReturnValue({ eq });
    (supabase.from as jest.Mock).mockReturnValue({ select });

    const result = await checkHostCanAcceptBooking('host-1', 300);

    expect(result.canAccept).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.message).toBe('Wallet not found. Please contact support.');
  });

  it('returns generic message when an unexpected error occurs', async () => {
    (getCurrentCommissionRate as jest.Mock).mockRejectedValue(new Error('service down'));

    const result = await checkHostCanAcceptBooking('host-1', 300);

    expect(result.canAccept).toBe(false);
    expect(result.currentBalance).toBe(0);
    expect(result.commissionAmount).toBe(0);
    expect(result.message).toBe('Error checking wallet balance. Please try again.');
  });
});
