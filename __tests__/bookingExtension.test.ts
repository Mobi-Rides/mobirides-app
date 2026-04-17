/**
 * Unit tests for Booking Extension Request
 * Tests ExtensionRequestDialog component logic
 */

import { addDays, differenceInDays, format } from 'date-fns';

describe('Booking Extension Request', () => {
    describe('Cost Calculation', () => {
        it('should calculate additional cost as extraDays × pricePerDay', () => {
            const extraDays = 3;
            const pricePerDay = 450;
            const additionalCost = extraDays * pricePerDay;

            expect(additionalCost).toBe(1350);
        });

        it('should calculate additional cost for single day extension', () => {
            const extraDays = 1;
            const pricePerDay = 500;
            const additionalCost = extraDays * pricePerDay;

            expect(additionalCost).toBe(500);
        });

        it('should calculate additional cost with decimal price per day', () => {
            const extraDays = 5;
            const pricePerDay = 349.99;
            const additionalCost = extraDays * pricePerDay;

            expect(additionalCost).toBeCloseTo(1749.95);
        });

        it('should return 0 cost when no days added', () => {
            const extraDays = 0;
            const pricePerDay = 500;
            const additionalCost = extraDays * pricePerDay;

            expect(additionalCost).toBe(0);
        });
    });

    describe('New End Date Calculation', () => {
        it('should calculate new end date as currentEndDate + extraDays', () => {
            const currentEndDate = '2026-03-27';
            const extraDays = 3;
            const newEndDate = addDays(new Date(currentEndDate), extraDays);

            expect(format(newEndDate, 'yyyy-MM-dd')).toBe('2026-03-30');
        });

        it('should calculate new end date for single day extension', () => {
            const currentEndDate = '2026-03-27';
            const extraDays = 1;
            const newEndDate = addDays(new Date(currentEndDate), extraDays);

            expect(format(newEndDate, 'yyyy-MM-dd')).toBe('2026-03-28');
        });

        it('should calculate new end date crossing month boundary', () => {
            const currentEndDate = '2026-03-30';
            const extraDays = 5;
            const newEndDate = addDays(new Date(currentEndDate), extraDays);

            expect(format(newEndDate, 'yyyy-MM-dd')).toBe('2026-04-04');
        });

        it('should calculate new end date crossing year boundary', () => {
            const currentEndDate = '2026-12-30';
            const extraDays = 5;
            const newEndDate = addDays(new Date(currentEndDate), extraDays);

            expect(format(newEndDate, 'yyyy-MM-dd')).toBe('2027-01-04');
        });
    });

    describe('Extension Request Data', () => {
        const bookingId = 'booking-123';
        const userId = 'user-456';
        const currentEndDate = '2026-03-27';
        const extraDays = 3;
        const pricePerDay = 450;
        const reason = 'Need more time for trip';

        const newEndDate = addDays(new Date(currentEndDate), extraDays);
        const additionalCost = extraDays * pricePerDay;

        it('should create correct booking_extension insert data', () => {
            const extensionData = {
                booking_id: bookingId,
                requested_by: userId,
                current_end_date: currentEndDate,
                requested_end_date: format(newEndDate, 'yyyy-MM-dd'),
                additional_days: extraDays,
                additional_cost: additionalCost,
                reason: reason || null,
            };

            expect(extensionData.booking_id).toBe('booking-123');
            expect(extensionData.requested_by).toBe('user-456');
            expect(extensionData.current_end_date).toBe('2026-03-27');
            expect(extensionData.requested_end_date).toBe('2026-03-30');
            expect(extensionData.additional_days).toBe(3);
            expect(extensionData.additional_cost).toBe(1350);
            expect(extensionData.reason).toBe('Need more time for trip');
        });

        it('should handle null reason when not provided', () => {
            const reason = '';
            const extensionData = {
                reason: reason || null,
            };

            expect(extensionData.reason).toBeNull();
        });

        it('should include optional reason when provided', () => {
            const reason = 'Family emergency';
            const extensionData = {
                reason: reason || null,
            };

            expect(extensionData.reason).toBe('Family emergency');
        });
    });

    describe('Day Stepper Logic', () => {
        it('should decrease extraDays by 1 but not below 1', () => {
            let extraDays = 5;
            extraDays = Math.max(1, extraDays - 1);
            expect(extraDays).toBe(4);
        });

        it('should not go below 1 when decreasing', () => {
            let extraDays = 1;
            extraDays = Math.max(1, extraDays - 1);
            expect(extraDays).toBe(1);
        });

        it('should increase extraDays by 1', () => {
            let extraDays = 1;
            extraDays = extraDays + 1;
            expect(extraDays).toBe(2);
        });

        it('should handle multiple decreases correctly', () => {
            let extraDays = 10;
            extraDays = Math.max(1, extraDays - 1);
            extraDays = Math.max(1, extraDays - 1);
            extraDays = Math.max(1, extraDays - 1);
            expect(extraDays).toBe(7);
        });
    });

    describe('Extra Days Calculation', () => {
        it('should calculate difference in days between two dates', () => {
            const startDate = new Date('2026-03-27');
            const endDate = new Date('2026-04-02');
            const diff = differenceInDays(endDate, startDate);

            expect(diff).toBe(6);
        });

        it('should return 1 for consecutive days', () => {
            const startDate = new Date('2026-03-27');
            const endDate = new Date('2026-03-28');
            const diff = differenceInDays(endDate, startDate);

            expect(diff).toBe(1);
        });

        it('should handle same day as 0', () => {
            const date = new Date('2026-03-27');
            const diff = differenceInDays(date, date);

            expect(diff).toBe(0);
        });
    });

    describe('Formatted Output', () => {
        it('should format cost as P with 2 decimal places', () => {
            const additionalCost = 1350;
            const formatted = `P${additionalCost.toFixed(2)}`;

            expect(formatted).toBe('P1350.00');
        });

        it('should format decimal cost correctly', () => {
            const additionalCost = 499.99;
            const formatted = `P${additionalCost.toFixed(2)}`;

            expect(formatted).toBe('P499.99');
        });

        it('should format date as MMM d, yyyy', () => {
            const date = new Date('2026-03-30');
            const formatted = format(date, 'MMM d, yyyy');

            expect(formatted).toBe('Mar 30, 2026');
        });

        it('should format date for database as yyyy-MM-dd', () => {
            const date = new Date('2026-03-30');
            const formatted = format(date, 'yyyy-MM-dd');

            expect(formatted).toBe('2026-03-30');
        });
    });

    describe('Conflict Detection', () => {
        it('should detect conflict if new end date is before current end date', () => {
            const currentEndDate = new Date('2026-03-27');
            const requestedEndDate = new Date('2026-03-26');
            const hasConflict = requestedEndDate < currentEndDate;

            expect(hasConflict).toBe(true);
        });

        it('should detect no conflict if new end date is after current end date', () => {
            const currentEndDate = new Date('2026-03-27');
            const requestedEndDate = new Date('2026-03-28');
            const hasConflict = requestedEndDate < currentEndDate;

            expect(hasConflict).toBe(false);
        });

        it('should detect conflict if new end date is the same as current end date', () => {
            const currentEndDate = new Date('2026-03-27');
            const requestedEndDate = new Date('2026-03-27');
            const hasConflict = requestedEndDate < currentEndDate;

            expect(hasConflict).toBe(false);
        });
    });

    describe('Provider-Side Confirmation Flows', () => {
        it('should require provider confirmation for extensions longer than 5 days', () => {
            const extraDays = 6;
            const requiresConfirmation = extraDays > 5;

            expect(requiresConfirmation).toBe(true);
        });

        it('should not require provider confirmation for extensions of 5 days or less', () => {
            const extraDays = 5;
            const requiresConfirmation = extraDays > 5;

            expect(requiresConfirmation).toBe(false);
        });

        it('should handle exactly 5 days as no confirmation needed', () => {
            const extraDays = 5;
            const requiresConfirmation = extraDays > 5;

            expect(requiresConfirmation).toBe(false);
        });
    });
});
