jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { getCurrentCommissionRate } from '@/services/commission/commissionRates';

describe('getCurrentCommissionRate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns active commission rate from DB', async () => {
    const single = jest.fn().mockResolvedValue({ data: { rate: 0.18 }, error: null });
    const limit = jest.fn().mockReturnValue({ single });
    const order = jest.fn().mockReturnValue({ limit });
    const or = jest.fn().mockReturnValue({ order });
    const lte = jest.fn().mockReturnValue({ or });
    const select = jest.fn().mockReturnValue({ lte });

    (supabase.from as jest.Mock).mockReturnValue({ select });

    const rate = await getCurrentCommissionRate();
    expect(rate).toBe(0.18);
  });

  it('falls back to default setting when commission_rates query errors', async () => {
    const singleDefault = jest.fn().mockResolvedValue({ data: { setting_value: '0.2' }, error: null });
    const eqDefault = jest.fn().mockReturnValue({ single: singleDefault });
    const selectDefault = jest.fn().mockReturnValue({ eq: eqDefault });

    const singleRates = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const limitRates = jest.fn().mockReturnValue({ single: singleRates });
    const orderRates = jest.fn().mockReturnValue({ limit: limitRates });
    const orRates = jest.fn().mockReturnValue({ order: orderRates });
    const lteRates = jest.fn().mockReturnValue({ or: orRates });
    const selectRates = jest.fn().mockReturnValue({ lte: lteRates });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: selectRates })
      .mockReturnValueOnce({ select: selectDefault });

    const rate = await getCurrentCommissionRate();
    expect(rate).toBe(0.2);
  });

  it('returns hard fallback 0.15 when settings query fails', async () => {
    const singleDefault = jest.fn().mockResolvedValue({ data: null, error: { message: 'no settings' } });
    const eqDefault = jest.fn().mockReturnValue({ single: singleDefault });
    const selectDefault = jest.fn().mockReturnValue({ eq: eqDefault });

    const singleRates = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } });
    const limitRates = jest.fn().mockReturnValue({ single: singleRates });
    const orderRates = jest.fn().mockReturnValue({ limit: limitRates });
    const orRates = jest.fn().mockReturnValue({ order: orderRates });
    const lteRates = jest.fn().mockReturnValue({ or: orRates });
    const selectRates = jest.fn().mockReturnValue({ lte: lteRates });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ select: selectRates })
      .mockReturnValueOnce({ select: selectDefault });

    const rate = await getCurrentCommissionRate();
    expect(rate).toBe(0.15);
  });
});
