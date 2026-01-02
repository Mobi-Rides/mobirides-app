
export const supabase = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                single: jest.fn(),
                maybeSingle: jest.fn(),
            })),
        })),
        insert: jest.fn(() => ({
            select: jest.fn(() => ({
                single: jest.fn(),
            })),
        })),
        update: jest.fn(() => ({
            eq: jest.fn(),
        })),
    })),
    rpc: jest.fn(),
    storage: {
        from: jest.fn(() => ({
            upload: jest.fn(),
            getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock-url.com' } })),
        })),
    }
};
