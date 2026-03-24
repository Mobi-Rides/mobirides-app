/**
 * Unit tests for Handover Service
 * Tests handover session creation, step validation, and status transitions
 */

import {
    createPickupHandoverSession,
    createReturnHandoverSession,
    createHandoverSession,
    getHandoverSession,
    getLatestHandoverSession,
    hasCompletedPickupHandover,
    HandoverType,
    PickupHandoverData,
    ReturnHandoverData
} from '../src/services/handoverService';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn()
        }
    }
}));

// Mock toast
jest.mock('@/utils/toast-utils', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    }
}));

import { supabase } from '@/integrations/supabase/client';

describe('Handover Service', () => {
    const mockUser = { id: 'user-123' };

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: mockUser },
            error: null
        });
    });

    describe('createPickupHandoverSession', () => {
        const pickupData: PickupHandoverData = {
            booking_id: 'booking-123',
            host_id: 'host-456',
            renter_id: 'renter-789'
        };

        it('should create a new pickup handover session', async () => {
            const mockSession = {
                id: 'session-1',
                booking_id: 'booking-123',
                host_id: 'host-456',
                renter_id: 'renter-789',
                host_ready: false,
                renter_ready: false,
                handover_completed: false,
                handover_type: 'pickup',
                is_interactive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Mock no existing session
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                        })
                    })
                })
            });

            // Mock profile fetch
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { full_name: 'Test Host' },
                            error: null
                        })
                    })
                })
            });

            // Mock booking fetch
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { car_id: 'car-1' },
                            error: null
                        })
                    })
                })
            });

            // Mock notification insert
            (supabase.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockResolvedValue({ error: null })
            });

            // Mock session insert
            (supabase.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
                    })
                })
            });

            const result = await createPickupHandoverSession(pickupData);

            expect(result.booking_id).toBe('booking-123');
            expect(result.handover_type).toBe('pickup');
            expect(result.host_ready).toBe(false);
            expect(result.renter_ready).toBe(false);
        });

        it('should return existing session if one already exists', async () => {
            const existingSession = {
                id: 'existing-session',
                booking_id: 'booking-123',
                handover_type: 'pickup'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: existingSession, error: null })
                        })
                    })
                })
            });

            const result = await createPickupHandoverSession(pickupData);

            expect(result.id).toBe('existing-session');
        });

        it('should throw error if user is not authenticated', async () => {
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: null },
                error: null
            });

            await expect(createPickupHandoverSession(pickupData)).rejects.toThrow(
                'User not authenticated - no user object returned'
            );
        });

        it('should handle RLS policy violations gracefully', async () => {
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                        })
                    })
                })
            });

            // Mock session insert with RLS error
            (supabase.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: null,
                            error: { code: '42501', message: 'Permission denied' }
                        })
                    })
                })
            });

            await expect(createPickupHandoverSession(pickupData)).rejects.toThrow(
                'Permission denied'
            );
        });
    });

    describe('createReturnHandoverSession', () => {
        const returnData: ReturnHandoverData = {
            booking_id: 'booking-123',
            host_id: 'host-456',
            renter_id: 'renter-789'
        };

        it('should create a new return handover session', async () => {
            const mockSession = {
                id: 'session-2',
                booking_id: 'booking-123',
                host_id: 'host-456',
                renter_id: 'renter-789',
                host_ready: false,
                renter_ready: false,
                handover_completed: false,
                handover_type: 'return',
                is_interactive: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Mock no existing session
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                        })
                    })
                })
            });

            // Mock profile fetch
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { full_name: 'Test Renter' },
                            error: null
                        })
                    })
                })
            });

            // Mock booking fetch
            (supabase.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                            data: { car_id: 'car-1' },
                            error: null
                        })
                    })
                })
            });

            // Mock notification insert
            (supabase.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockResolvedValue({ error: null })
            });

            // Mock session insert
            (supabase.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockSession, error: null })
                    })
                })
            });

            const result = await createReturnHandoverSession(returnData);

            expect(result.booking_id).toBe('booking-123');
            expect(result.handover_type).toBe('return');
        });
    });

    describe('createHandoverSession (backward compatibility)', () => {
        it('should create pickup session when type is pickup', async () => {
            const mockSession = {
                id: 'session-3',
                booking_id: 'booking-456',
                handover_type: 'pickup'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            maybeSingle: jest.fn().mockResolvedValue({ data: mockSession, error: null })
                        })
                    })
                })
            });

            const result = await createHandoverSession(
                'booking-456',
                'pickup',
                'host-123',
                'renter-456'
            );

            expect(result.handover_type).toBe('pickup');
        });

        it('should throw error for invalid handover type', async () => {
            await expect(
                createHandoverSession('booking-123', 'invalid' as HandoverType, 'host', 'renter')
            ).rejects.toThrow('Invalid handover type');
        });

        it('should throw error when booking ID is missing', async () => {
            await expect(
                createHandoverSession('', 'pickup', 'host', 'renter')
            ).rejects.toThrow('Booking ID is required');
        });

        it('should throw error when host ID is missing', async () => {
            await expect(
                createHandoverSession('booking-123', 'pickup', '', 'renter')
            ).rejects.toThrow('Host ID is required');
        });

        it('should throw error when renter ID is missing', async () => {
            await expect(
                createHandoverSession('booking-123', 'pickup', 'host', '')
            ).rejects.toThrow('Renter ID is required');
        });
    });

    describe('getHandoverSession', () => {
        it('should fetch handover session by booking ID', async () => {
            const mockSession = {
                id: 'session-1',
                booking_id: 'booking-123',
                handover_type: 'pickup'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            order: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    maybeSingle: jest.fn().mockResolvedValue({ data: mockSession, error: null })
                                })
                            })
                        })
                    })
                })
            });

            const result = await getHandoverSession('booking-123');

            expect(result).toEqual(mockSession);
        });

        it('should filter by handover type when provided', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                order: jest.fn().mockReturnValue({
                                    limit: jest.fn().mockReturnValue({
                                        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                                    })
                                })
                            })
                        })
                    })
                })
            });

            await getHandoverSession('booking-123', 'pickup');

            // Verify the query chain includes handover_type filter
            const mockFrom = supabase.from as jest.Mock;
            expect(mockFrom).toHaveBeenCalledWith('handover_sessions');
        });
    });

    describe('getLatestHandoverSession', () => {
        it('should fetch latest handover session for a booking', async () => {
            const mockSession = {
                id: 'session-latest',
                booking_id: 'booking-123'
            };

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: mockSession, error: null })
                            })
                        })
                    })
                })
            });

            const result = await getLatestHandoverSession('booking-123');

            expect(result).toEqual(mockSession);
        });
    });

    describe('hasCompletedPickupHandover', () => {
        it('should return true when pickup handover is completed', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({
                                    data: { handover_completed: true },
                                    error: null
                                })
                            })
                        })
                    })
                })
            });

            const result = await hasCompletedPickupHandover('booking-123');

            expect(result).toBe(true);
        });

        it('should return false when pickup handover is not completed', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
                            })
                        })
                    })
                })
            });

            const result = await hasCompletedPickupHandover('booking-123');

            expect(result).toBe(false);
        });
    });
});
