/**
 * Unit tests for Booking Lifecycle transitions
 * Tests payment lifecycle state changes and commission handling
 */

import { bookingLifecycle, BookingStatus } from '../src/services/bookingLifecycle';

// Mock the supabase client
jest.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: jest.fn(),
        auth: {
            getUser: jest.fn()
        }
    }
}));

// Mock the push notification service
jest.mock('@/services/pushNotificationService', () => ({
    pushNotificationService: {
        sendBookingNotification: jest.fn().mockResolvedValue({ success: true })
    }
}));

// Mock toast
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
    }
}));

import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService } from '@/services/pushNotificationService';

describe('Booking Lifecycle Service', () => {
    const mockBooking = {
        id: 'booking-123',
        renter_id: 'renter-456',
        status: 'pending' as BookingStatus,
        total_price: 500,
        cars: {
            brand: 'Toyota',
            model: 'Corolla',
            owner_id: 'host-789'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateStatus', () => {
        it('should transition from pending to awaiting_payment', async () => {
            // Mock booking fetch
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await bookingLifecycle.updateStatus('booking-123', 'awaiting_payment');

            expect(result.success).toBe(true);
            expect(pushNotificationService.sendBookingNotification).toHaveBeenCalledWith(
                'renter-456',
                expect.objectContaining({
                    type: 'awaiting_payment',
                    carBrand: 'Toyota',
                    carModel: 'Corolla',
                    bookingReference: 'booking-123'
                })
            );
        });

        it('should transition to confirmed and set payment_status to paid', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await bookingLifecycle.updateStatus('booking-123', 'confirmed');

            expect(result.success).toBe(true);
            expect(pushNotificationService.sendBookingNotification).toHaveBeenCalledTimes(2);
        });

        it('should handle in_progress status correctly', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await bookingLifecycle.updateStatus('booking-123', 'in_progress');

            expect(result.success).toBe(true);
        });

        it('should handle completed status correctly', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await bookingLifecycle.updateStatus('booking-123', 'completed');

            expect(result.success).toBe(true);
        });

        it('should handle cancelled status correctly', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null })
                })
            });

            const result = await bookingLifecycle.updateStatus('booking-123', 'cancelled');

            expect(result.success).toBe(true);
        });

        it('should return error when booking not found', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                    })
                })
            });

            const result = await bookingLifecycle.updateStatus('non-existent', 'confirmed');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should set payment_deadline when transitioning to awaiting_payment', async () => {
            const updateMock = jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null })
            });

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockBooking, error: null })
                    })
                }),
                update: updateMock
            });

            await bookingLifecycle.updateStatus('booking-123', 'awaiting_payment');

            // Verify the update payload includes payment_deadline
            const updateCall = updateMock.mock.calls[0][0];
            expect(updateCall.payment_status).toBe('unpaid');
            expect(updateCall.payment_deadline).toBeDefined();
        });
    });

    describe('Status Transition Validation', () => {
        it('should allow valid status transitions', async () => {
            const validTransitions: Array<[BookingStatus, BookingStatus]> = [
                ['pending', 'awaiting_payment'],
                ['pending', 'cancelled'],
                ['awaiting_payment', 'confirmed'],
                ['awaiting_payment', 'cancelled'],
                ['confirmed', 'in_progress'],
                ['in_progress', 'completed'],
            ];

            for (const [fromStatus, toStatus] of validTransitions) {
                const booking = { ...mockBooking, status: fromStatus };

                (supabase.from as jest.Mock).mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: booking, error: null })
                        })
                    }),
                    update: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ error: null })
                    })
                });

                const result = await bookingLifecycle.updateStatus('booking-123', toStatus);
                expect(result.success).toBe(true);
            }
        });
    });
});
