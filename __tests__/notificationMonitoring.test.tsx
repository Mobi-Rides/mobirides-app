import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Supabase mock: support .from(...).select(...).order(...) chain used by the component
type CampaignRow = {
  id: string;
  name: string;
  status: string;
  total_recipients: number | null;
  successful_sends: number | null;
  sent_at: string | null;
  created_at: string;
};

let mockRows: CampaignRow[] = [];

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (_table: string) => ({
      select: (_cols?: string) => ({
        order: (_col: string, _opts?: unknown) =>
          Promise.resolve({ data: mockRows, error: null }),
      }),
    }),
  },
}));

import { NotificationMonitoring } from '@/components/admin/NotificationMonitoring';

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  mockRows = [];
});

describe('NotificationMonitoring', () => {
  it('renders empty-state when no campaigns exist', async () => {
    mockRows = [];
    renderWithClient(<NotificationMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('No campaign data')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Sent')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Delivery Rate')).toBeInTheDocument();

    const allZeros = screen.getAllByText('0');
    expect(allZeros.length).toBeGreaterThanOrEqual(2); // Total Sent + Delivered
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('aggregates metrics across completed campaigns and renders the table', async () => {
    mockRows = [
      {
        id: 'c1',
        name: 'Welcome Blast',
        status: 'completed',
        total_recipients: 1000,
        successful_sends: 950,
        sent_at: '2026-04-01T10:00:00.000Z',
        created_at: '2026-04-01T09:00:00.000Z',
      },
      {
        id: 'c2',
        name: 'Spring Promo',
        status: 'completed',
        total_recipients: 500,
        successful_sends: 400,
        sent_at: '2026-04-15T14:00:00.000Z',
        created_at: '2026-04-15T13:00:00.000Z',
      },
      {
        id: 'c3',
        name: 'Broken Send',
        status: 'failed',
        total_recipients: 100,
        successful_sends: 0,
        sent_at: null,
        created_at: '2026-04-20T08:00:00.000Z',
      },
      {
        id: 'c4',
        name: 'Future Push',
        status: 'scheduled',
        total_recipients: null,
        successful_sends: null,
        sent_at: null,
        created_at: '2026-05-01T08:00:00.000Z',
      },
    ];

    renderWithClient(<NotificationMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Blast')).toBeInTheDocument();
    });

    // Aggregates: only `completed` rows count toward Total Sent / Delivered / Failed
    // Sent  = 1000 + 500   = 1500
    // Sent  = 950  + 400   = 1350 delivered
    // Failed = 1500 - 1350 = 150
    // Rate   = 1350 / 1500 = 90.0%
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('1,350')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('90.0%')).toBeInTheDocument();

    // "+ 1 failed campaigns" caption
    expect(screen.getByText(/\+\s*1\s*failed campaigns/i)).toBeInTheDocument();

    // Subheading on summary card mentions completed count
    expect(screen.getByText(/across 2 completed campaigns/i)).toBeInTheDocument();

    // Per-row check: Welcome Blast row
    const welcomeRow = screen.getByText('Welcome Blast').closest('tr')!;
    expect(welcomeRow).not.toBeNull();
    const w = within(welcomeRow);
    expect(w.getByText('completed')).toBeInTheDocument();
    expect(w.getByText('1,000')).toBeInTheDocument(); // recipients
    expect(w.getByText('950')).toBeInTheDocument();   // delivered
    expect(w.getByText('50')).toBeInTheDocument();    // failed = 1000 - 950
    expect(w.getByText('95.0%')).toBeInTheDocument(); // rate

    // Per-row check: Future Push (no data) renders dashes
    const futureRow = screen.getByText('Future Push').closest('tr')!;
    const f = within(futureRow);
    expect(f.getAllByText('—').length).toBeGreaterThanOrEqual(4); // recipients/delivered/failed/rate/sent
    expect(f.getByText('scheduled')).toBeInTheDocument();
  });

  it('shows zero failed-campaigns caption when none failed', async () => {
    mockRows = [
      {
        id: 'c1',
        name: 'Solo Send',
        status: 'completed',
        total_recipients: 200,
        successful_sends: 200,
        sent_at: '2026-04-01T10:00:00.000Z',
        created_at: '2026-04-01T09:00:00.000Z',
      },
    ];

    renderWithClient(<NotificationMonitoring />);

    await waitFor(() => {
      expect(screen.getByText('Solo Send')).toBeInTheDocument();
    });

    expect(screen.getByText(/no failed campaigns/i)).toBeInTheDocument();
    // 100.0% renders in both the Delivery Rate summary card and the row's Rate column
    expect(screen.getAllByText('100.0%')).toHaveLength(2);
  });
});
