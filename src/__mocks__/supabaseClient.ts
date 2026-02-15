
// Mock Supabase client
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    })),
  })),
  rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnThis(),
    unsubscribe: jest.fn(),
  })),
  auth: {
    getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
  },
};
