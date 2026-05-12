import React from 'react';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Supabase mock that tracks channel lifecycle events for both fixes:
//   Bug A — Navigation.tsx: hardcoded channel name + cleanup returned from
//           inner async fn (so React never called it, channels leaked).
//   Bug B — useConversationMessages: early `return () => {...}` made the
//           authListener registration and the receipts cleanup unreachable.
// ---------------------------------------------------------------------------
type ChannelRecord = {
  name: string;
  removed: boolean;
  onCalls: number;
  subscribed: boolean;
};

const tracker = {
  channels: [] as ChannelRecord[],
  authListeners: [] as Array<{ unsubscribed: boolean }>,
};

function createChannel(name: string): any {
  const record: ChannelRecord = { name, removed: false, onCalls: 0, subscribed: false };
  tracker.channels.push(record);

  const chan: any = {
    _record: record,
    on: function (..._args: any[]) {
      // BUG REPRO: real Supabase throws here if .subscribe() already ran
      if (record.subscribed) {
        throw new Error(
          `cannot add \`postgres_changes\` callbacks for realtime:${name} after \`subscribe()\`.`,
        );
      }
      record.onCalls += 1;
      return chan;
    },
    subscribe: function (cb?: (status: string) => void) {
      record.subscribed = true;
      if (cb) cb('SUBSCRIBED');
      return chan;
    },
    unsubscribe: () => {},
  };
  return chan;
}

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: (name: string) => createChannel(name),
    removeChannel: (chan: any) => {
      if (chan?._record) chan._record.removed = true;
      return Promise.resolve();
    },
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: 'user-42' } }, error: null }),
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'user-42' } } },
          error: null,
        }),
      onAuthStateChange: () => {
        const listener = { unsubscribed: false };
        tracker.authListeners.push(listener);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listener.unsubscribed = true;
              },
            },
          },
        };
      },
      refreshSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'user-42' } } },
          error: null,
        }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: [], error: null }),
          order: () => Promise.resolve({ data: [], error: null }),
          limit: () => Promise.resolve({ data: [], error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        in: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
  },
}));

jest.mock('@/utils/avatarUtils', () => ({
  getAvatarPublicUrl: (p?: string | null) => p || null,
}));

jest.mock('sonner', () => ({
  toast: { success: () => {}, error: () => {} },
}));

import { Navigation } from '@/components/Navigation';
import { useConversationMessages } from '@/hooks/useOptimizedConversations';

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

function NavWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function HookWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  tracker.channels = [];
  tracker.authListeners = [];
});

// ---------------------------------------------------------------------------
// Bug A — Navigation.tsx
// ---------------------------------------------------------------------------
describe('Navigation realtime fix (Bug A)', () => {
  it('uses a user-scoped channel name (not the bare "navigation-updates")', async () => {
    render(
      <NavWrapper>
        <Navigation />
      </NavWrapper>,
    );

    await waitFor(() => {
      expect(tracker.channels.length).toBeGreaterThan(0);
    });

    const navChannel = tracker.channels.find((c) =>
      c.name.startsWith('navigation-updates'),
    );
    expect(navChannel).toBeDefined();
    expect(navChannel!.name).toBe('navigation-updates-user-42');
    // Bug-reproduction guard: must NOT be the hardcoded name that collides.
    expect(navChannel!.name).not.toBe('navigation-updates');
  });

  it('attaches both .on() handlers before .subscribe()', async () => {
    render(
      <NavWrapper>
        <Navigation />
      </NavWrapper>,
    );

    await waitFor(() => {
      const c = tracker.channels.find((c) => c.name.startsWith('navigation-updates'));
      expect(c?.subscribed).toBe(true);
    });

    const navChannel = tracker.channels.find((c) =>
      c.name.startsWith('navigation-updates'),
    )!;
    // 2 .on() calls registered (messages + read receipts) before .subscribe()
    expect(navChannel.onCalls).toBe(2);
  });

  it('removes the channel when the component unmounts', async () => {
    const { unmount } = render(
      <NavWrapper>
        <Navigation />
      </NavWrapper>,
    );

    await waitFor(() => {
      expect(
        tracker.channels.find((c) => c.name.startsWith('navigation-updates'))?.subscribed,
      ).toBe(true);
    });

    unmount();

    // The cleanup fn returned from useEffect must call removeChannel
    await waitFor(() => {
      const c = tracker.channels.find((c) => c.name.startsWith('navigation-updates'));
      expect(c?.removed).toBe(true);
    });
  });

  it('mount + unmount + remount produces two distinct, independently-cleaned channels', async () => {
    // First mount
    const r1 = render(
      <NavWrapper>
        <Navigation />
      </NavWrapper>,
    );
    await waitFor(() => {
      expect(tracker.channels.find((c) => c.name.startsWith('navigation-updates'))).toBeDefined();
    });
    r1.unmount();

    // Second mount
    const r2 = render(
      <NavWrapper>
        <Navigation />
      </NavWrapper>,
    );
    await waitFor(() => {
      const navChans = tracker.channels.filter((c) =>
        c.name.startsWith('navigation-updates'),
      );
      expect(navChans.length).toBeGreaterThanOrEqual(2);
    });

    const navChans = tracker.channels.filter((c) =>
      c.name.startsWith('navigation-updates'),
    );
    // Bug A repro: with the old hardcoded name, the second .on() would throw.
    // We assert no error escaped (channel got created and onCalls incremented).
    navChans.forEach((c) => expect(c.onCalls).toBe(2));
    // First channel should already be removed (cleanup ran on unmount)
    expect(navChans[0].removed).toBe(true);

    r2.unmount();
  });
});

// ---------------------------------------------------------------------------
// Bug B — useConversationMessages auth listener + receipts cleanup
// ---------------------------------------------------------------------------
describe('useConversationMessages realtime fix (Bug B)', () => {
  it('registers an auth state listener (was unreachable before fix)', async () => {
    renderHook(() => useConversationMessages('conv-7'), { wrapper: HookWrapper });

    await waitFor(() => {
      expect(tracker.authListeners.length).toBeGreaterThan(0);
    });
  });

  it('creates both messages and receipts channels', async () => {
    renderHook(() => useConversationMessages('conv-7'), { wrapper: HookWrapper });

    await waitFor(() => {
      const messages = tracker.channels.find((c) =>
        c.name.startsWith('auth-aware-messages-conv-7'),
      );
      const receipts = tracker.channels.find((c) =>
        c.name.startsWith('auth-aware-receipts-conv-7'),
      );
      expect(messages).toBeDefined();
      expect(receipts).toBeDefined();
      expect(messages!.subscribed).toBe(true);
      expect(receipts!.subscribed).toBe(true);
    });
  });

  it('cleanup removes both channels and unsubscribes the auth listener on unmount', async () => {
    const { unmount } = renderHook(() => useConversationMessages('conv-7'), {
      wrapper: HookWrapper,
    });

    // wait for setup to finish
    await waitFor(() => {
      expect(
        tracker.channels.find((c) => c.name.startsWith('auth-aware-messages-conv-7'))
          ?.subscribed,
      ).toBe(true);
      expect(
        tracker.channels.find((c) => c.name.startsWith('auth-aware-receipts-conv-7'))
          ?.subscribed,
      ).toBe(true);
      expect(tracker.authListeners.length).toBeGreaterThan(0);
    });

    unmount();

    await waitFor(() => {
      const messages = tracker.channels.find((c) =>
        c.name.startsWith('auth-aware-messages-conv-7'),
      )!;
      const receipts = tracker.channels.find((c) =>
        c.name.startsWith('auth-aware-receipts-conv-7'),
      )!;
      expect(messages.removed).toBe(true);
      // Receipts channel cleanup was leaking before the fix
      expect(receipts.removed).toBe(true);
      // Auth listener was unreachable before the fix; now must be unsubscribed
      expect(tracker.authListeners.every((l) => l.unsubscribed)).toBe(true);
    });
  });
});
