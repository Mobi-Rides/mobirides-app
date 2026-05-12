import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Supabase mock: a chainable query builder + rpc/channel/auth stubs.
// Tests configure it via `__set` helpers to inject row data and capture calls.
// ---------------------------------------------------------------------------
type Row = Record<string, any>;

const state = {
  rows: new Map<string, Row[]>(), // table -> rows
  rpcCalls: [] as Array<{ fn: string; params: any }>,
  rpcResponses: new Map<string, any>(), // fn -> { data, error }
};

function makeBuilder(table: string) {
  // Snapshot rows at builder creation; not reactive to inserts/updates.
  let rows: Row[] = [...(state.rows.get(table) || [])];

  const builder: any = {
    select: (_cols?: string) => builder,
    eq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] === val);
      return builder;
    },
    in: (col: string, vals: any[]) => {
      rows = rows.filter((r) => vals.includes(r[col]));
      return builder;
    },
    neq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] !== val);
      return builder;
    },
    order: (_col: string, _opts?: any) => Promise.resolve({ data: rows, error: null }),
    limit: (_n: number) => Promise.resolve({ data: rows, error: null }),
    single: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    maybeSingle: () => Promise.resolve({ data: rows[0] ?? null, error: null }),
    update: (_values: Row) => ({
      eq: (_c: string, _v: any) => ({
        eq: (_c2: string, _v2: any) => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: (_values: Row) => Promise.resolve({ data: null, error: null }),
    delete: () => ({
      eq: (_c: string, _v: any) => ({
        eq: (_c2: string, _v2: any) => ({
          eq: (_c3: string, _v3: any) => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    // Allow awaiting the builder directly (some hook code does this).
    then: (resolve: any) => resolve({ data: rows, error: null }),
  };

  return builder;
}

const channelStub = {
  on: function () {
    return this;
  },
  subscribe: function (cb?: (status: string) => void) {
    if (cb) cb('SUBSCRIBED');
    return this;
  },
  unsubscribe: () => {},
};

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => makeBuilder(table),
    rpc: (fn: string, params: any) => {
      state.rpcCalls.push({ fn, params });
      const resp = state.rpcResponses.get(fn);
      return Promise.resolve(resp ?? { data: null, error: null });
    },
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        }),
      getUser: () =>
        Promise.resolve({ data: { user: { id: 'user-1' } }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      refreshSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'user-1' } } },
          error: null,
        }),
    },
    channel: () => channelStub,
    removeChannel: () => Promise.resolve(),
  },
}));

// Mock pushNotificationService to avoid dynamic import side-effects in onSuccess
jest.mock(
  '@/services/pushNotificationService',
  () => ({
    PushNotificationService: {
      getInstance: () => ({
        sendMessageNotification: () => Promise.resolve(),
      }),
    },
  }),
  { virtual: true },
);

// Avatar util makes a Supabase storage URL we don't need; stub to identity.
jest.mock('@/utils/avatarUtils', () => ({
  getAvatarPublicUrl: (path?: string | null) => path || null,
}));

// Sonner toast — silence
jest.mock('sonner', () => ({
  toast: {
    success: () => {},
    error: () => {},
  },
}));

import {
  useOptimizedConversations,
  useConversationMessages,
} from '@/hooks/useOptimizedConversations';

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  state.rows.clear();
  state.rpcCalls = [];
  state.rpcResponses.clear();
});

describe('Messaging — send path', () => {
  it('sendMessage invokes the send_conversation_message RPC with expected params', async () => {
    // user-1 participates in conversation conv-1 (so conv list is non-empty)
    state.rows.set('conversation_participants', [
      { conversation_id: 'conv-1', user_id: 'user-1', last_read_at: null },
    ]);
    state.rows.set('conversations', [
      {
        id: 'conv-1',
        title: null,
        type: 'direct',
        created_at: '2026-04-01T10:00:00.000Z',
        updated_at: '2026-04-01T10:00:00.000Z',
        last_message_at: null,
        created_by: 'user-1',
      },
    ]);

    state.rpcResponses.set('send_conversation_message', {
      data: {
        success: true,
        message_id: 'msg-99',
        conversation_id: 'conv-1',
        sender_id: 'user-1',
        content: 'hello world',
        message_type: 'text',
        metadata: {},
        created_at: '2026-04-02T08:00:00.000Z',
      },
      error: null,
    });

    const { result } = renderHook(() => useOptimizedConversations('user-1'), { wrapper });

    // wait for conversations query to settle
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.sendMessage({
        conversationId: 'conv-1',
        content: 'hello world',
      });
    });

    await waitFor(() => {
      expect(
        state.rpcCalls.some((c) => c.fn === 'send_conversation_message'),
      ).toBe(true);
    });

    const sendCall = state.rpcCalls.find(
      (c) => c.fn === 'send_conversation_message',
    )!;
    expect(sendCall.params).toMatchObject({
      p_conversation_id: 'conv-1',
      p_content: 'hello world',
      p_message_type: 'text',
      p_related_car_id: null,
      p_reply_to_message_id: null,
      p_metadata: {},
    });
  });

  it('sendMessage rejects empty content before hitting the RPC', async () => {
    const { result } = renderHook(() => useOptimizedConversations('user-1'), { wrapper });

    act(() => {
      result.current.sendMessage({ conversationId: 'conv-1', content: '   ' });
    });

    await waitFor(() => {
      expect(result.current.sendMessageError).toBeTruthy();
    });

    expect(
      state.rpcCalls.some((c) => c.fn === 'send_conversation_message'),
    ).toBe(false);
    expect(String(result.current.sendMessageError)).toMatch(/empty/i);
  });

  it('sendMessage surfaces RPC errors to the consumer', async () => {
    state.rpcResponses.set('send_conversation_message', {
      data: null,
      error: { message: 'permission denied' },
    });

    const { result } = renderHook(() => useOptimizedConversations('user-1'), { wrapper });

    act(() => {
      result.current.sendMessage({
        conversationId: 'conv-1',
        content: 'hi',
      });
    });

    await waitFor(() => {
      expect(result.current.sendMessageError).toBeTruthy();
    });

    expect(String(result.current.sendMessageError)).toMatch(/permission denied/i);
  });
});

describe('Messaging — receive path', () => {
  it('useConversationMessages fetches and transforms rows into Message[]', async () => {
    state.rows.set('conversation_messages', [
      {
        id: 'm-1',
        content: 'first message',
        sender_id: 'user-2',
        created_at: '2026-04-02T07:00:00.000Z',
        updated_at: null,
        message_type: 'text',
        metadata: {},
        edited: false,
        edited_at: null,
        reply_to_message_id: null,
        conversation_id: 'conv-1',
        sender: { id: 'user-2', full_name: 'Alice', avatar_url: null },
        message_reactions: [],
      },
      {
        id: 'm-2',
        content: 'second message',
        sender_id: 'user-1',
        created_at: '2026-04-02T07:05:00.000Z',
        updated_at: null,
        message_type: 'text',
        metadata: {},
        edited: false,
        edited_at: null,
        reply_to_message_id: null,
        conversation_id: 'conv-1',
        sender: { id: 'user-1', full_name: 'You', avatar_url: null },
        message_reactions: [{ emoji: '👍', user_id: 'user-2', created_at: '2026-04-02T07:06:00.000Z' }],
      },
    ]);

    const { result } = renderHook(() => useConversationMessages('conv-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeFalsy();
    expect(result.current.data).toHaveLength(2);

    const [first, second] = result.current.data!;
    expect(first).toMatchObject({
      id: 'm-1',
      content: 'first message',
      senderId: 'user-2',
      conversationId: 'conv-1',
      type: 'text',
      edited: false,
    });
    expect(first.sender).toMatchObject({ id: 'user-2', full_name: 'Alice' });
    expect(first.timestamp).toBeInstanceOf(Date);

    expect(second.reactions).toHaveLength(1);
    expect(second.reactions![0]).toMatchObject({
      emoji: '👍',
      userId: 'user-2',
    });
  });

  it('does not run the query when conversationId is undefined', async () => {
    const { result } = renderHook(() => useConversationMessages(undefined), { wrapper });
    // Query is disabled via `enabled: !!conversationId`, so it never fetches
    // and data stays undefined.
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
    // No RPC or table read should have been attempted on the messages path
    expect(state.rpcCalls.filter((c) => c.fn === 'send_conversation_message')).toHaveLength(0);
  });
});
