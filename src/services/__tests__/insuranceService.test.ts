
import { InsuranceService } from '../insuranceService';
import { insuranceNotificationService } from '../../services/wallet/insuranceNotificationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Notification Service
jest.mock('../../services/wallet/insuranceNotificationService', () => ({
    insuranceNotificationService: {
        sendClaimReceived: jest.fn(),
        sendHostClaimNotification: jest.fn(),
    }
}));

// Mock PDF Generator (to avoid jspdf issues in node env)
jest.mock('@/utils/pdfGenerator', () => ({
    generatePolicyPDF: jest.fn()
}));

describe('InsuranceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks behavior
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'test-renter-id', email: 'renter@example.com' } } });
        (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

        // Mock chain for 'from(table).insert(data).select().single()'
        const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'new-claim-id', claim_number: 'CLM-NEW' }, error: null });
        const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
        const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });

        (supabase.from as jest.Mock).mockImplementation((table: string) => {
            // Special handling for lookups
            if (table === 'profiles') {
                return {
                    select: (cols: string) => ({
                        eq: () => ({ single: jest.fn().mockResolvedValue({ data: { full_name: 'Test Renter' } }) })
                    })
                };
            }
            if (table === 'bookings') {
                return {
                    select: (cols: string) => ({
                        eq: () => ({
                            single: jest.fn().mockResolvedValue({
                                data: {
                                    cars: {
                                        owner_id: 'owner-456',
                                        make: 'Toyota',
                                        model: 'Corolla',
                                        profiles: { full_name: 'Test Host' }
                                    }
                                }
                            })
                        })
                    })
                };
            }

            return {
                insert: mockInsert,
                select: mockSelect, // fallback
                update: jest.fn()
            };
        });
    });

    describe('submitClaim', () => {
        it('should log activity and notify host on successful submission', async () => {
            // 1. Setup Data
            const claimData = {
                policy_id: 'policy-123',
                booking_id: 'booking-123',
                incident_date: '2025-10-10',
                incident_time: '12:00',
                incident_type: 'accident',
                incident_description: 'Test incident',
                damage_description: 'Scratch',
                estimated_damage_cost: 500
            };

            // 2. Mock specific RPC responses if needed
            (supabase.rpc as jest.Mock).mockImplementation((func, args) => {
                if (func === 'create_claim_notification') return Promise.resolve({ error: null });
                if (func === 'get_user_email_for_notification') return Promise.resolve({ data: 'host@example.com', error: null });
                return Promise.resolve({ data: null });
            });

            // 3. Execute
            const result = await InsuranceService.submitClaim(claimData as any);

            // 4. Verify
            expect(result.success).toBe(true);

            // Verify Host Notification Email
            expect(insuranceNotificationService.sendHostClaimNotification).toHaveBeenCalledWith(
                'host@example.com',
                'Test Host',
                expect.anything(),
                'Toyota Corolla'
            );

            // Verify Secure Email RPC was used
            expect(supabase.rpc).toHaveBeenCalledWith('get_user_email_for_notification', { user_uuid: 'owner-456' });
        });
    });
});
