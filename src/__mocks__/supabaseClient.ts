
// Mock Supabase client (plain stubs — no Jest dependency)
const noop = () => {};
const resolveData = (data: unknown) => Promise.resolve({ data, error: null });

export const supabase = {
  from: (_table: string) => ({
    select: (_columns?: string) => ({
      eq: (_col: string, _val: unknown) => ({
        single: () => resolveData({}),
        order: (_col2: string) => resolveData([]),
      }),
    }),
    update: (_values: unknown) => ({
      eq: (_col: string, _val: unknown) => resolveData({}),
    }),
  }),
  rpc: (_fn: string, _params?: unknown) => resolveData({ success: true }),
  channel: (_name: string) => ({
    on: function () { return this; },
    subscribe: function () { return this; },
    unsubscribe: noop,
  }),
  auth: {
    getUser: () => resolveData({ user: { id: 'test-user' } }),
  },
};
