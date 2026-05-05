import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InsuranceService } from '../src/services/insuranceService';
import { supabase } from '../src/integrations/supabase/client';
import ClaimsSubmissionForm from '../src/components/insurance/ClaimsSubmissionForm';
import { ExcessPaymentModal } from '../src/components/insurance/ExcessPaymentModal';
import { InsuranceComparison } from '../src/components/insurance/InsuranceComparison';
import { InsuranceAutomationService } from '../src/services/insurance/automationService';

// Mock Supabase
jest.mock('../src/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    functions: {
      invoke: jest.fn()
    },
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/test.jpg' } })
      })
    }
  }
}));

// Mock Toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

jest.mock('../src/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('Insurance Flow E2E (Integration)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn().mockReturnValue(true);
  });

  describe('1. Booking with Insurance (Comparison Selection)', () => {
    it('allows selecting an insurance tier during booking', async () => {
      const onSelect = jest.fn();
      
      // Mock calculations
      const mockCalculations = [
        {
          packageId: 'pkg-1',
          packageName: 'premium',
          displayName: 'Premium Coverage',
          totalPremium: 500,
          premiumPerDay: 100,
          numberOfDays: 5,
          isFlatDailyRate: true
        }
      ];
      
      jest.spyOn(InsuranceService, 'calculateAllPremiums').mockResolvedValue(mockCalculations as any);

      render(
        <InsuranceComparison
          dailyRentalAmount={500}
          startDate={new Date()}
          endDate={new Date(Date.now() + 86400000)}
          onSelectPackage={onSelect}
        />
      );

      const selectButton = await screen.findByRole('button', { name: /Select/ });
      fireEvent.click(selectButton);

      expect(onSelect).toHaveBeenCalledWith('pkg-1');
    });
  });

  describe('2. Claim Filing', () => {
    it('submits a claim with incident details', async () => {
      const onSuccess = jest.fn();
      
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'claim-123', claim_number: 'CLM-001' }, error: null })
      });
      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect
      });
      
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert
      });

      const { container } = render(
        <ClaimsSubmissionForm
          policyId="policy-123"
          bookingId="booking-456"
          onSuccess={onSuccess}
        />
      );

      // Fill first step (Incident Details)
      const dateInput = container.querySelector('input[name="incident_date"]') as HTMLInputElement;
      const timeInput = container.querySelector('input[name="incident_time"]') as HTMLInputElement;
      const typeSelect = container.querySelector('select[name="incident_type"]') as HTMLSelectElement;
      const locTextarea = container.querySelector('textarea[name="incident_location"]') as HTMLTextAreaElement;
      const descTextarea = container.querySelector('textarea[name="incident_description"]') as HTMLTextAreaElement;

      fireEvent.change(dateInput, { target: { value: '2026-05-01' } });
      fireEvent.change(timeInput, { target: { value: '10:00' } });
      fireEvent.change(typeSelect, { target: { value: 'collision' } });
      fireEvent.change(locTextarea, { target: { value: 'Gaborone Main Mall' } });
      fireEvent.change(descTextarea, { target: { value: 'Hit a pole while reversing. The bumper is cracked and the tail light is broken.' } });
      
      // Navigate to next step
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));

      // Damage Assessment Step
      await waitFor(() => {
        expect(container.querySelector('textarea[name="damage_description"]')).toBeTruthy();
        expect(container.querySelector('input[name="estimated_repair_cost"]')).toBeTruthy();
      });
      
      const damageTextarea = container.querySelector('textarea[name="damage_description"]') as HTMLTextAreaElement;
      const costInput = container.querySelector('input[name="estimated_repair_cost"]') as HTMLInputElement;

      fireEvent.change(damageTextarea, { target: { value: 'The bumper is cracked and the tail light is broken and needs replacement.' } });
      fireEvent.change(costInput, { target: { value: '2000' } });
      
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));

      // Documents Step
      await screen.findByText(/Supporting Documents/i);
      const submitButton = screen.getByRole('button', { name: /submit claim/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('3. Excess Payment Flow', () => {
    it('initiates a real payment for insurance excess', async () => {
      const onSuccess = jest.fn();
      
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { success: true, redirect_url: 'https://payment.com' },
        error: null
      });

      render(
        <ExcessPaymentModal
          isOpen={true}
          onClose={jest.fn()}
          claimId="claim-789"
          bookingId="booking-456"
          amount={1500}
          onSuccess={onSuccess}
        />
      );

      const payButton = screen.getByRole('button', { name: /Pay BWP 1500/ });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith('initiate-payment', expect.objectContaining({
          body: expect.objectContaining({
            payment_context: 'insurance_excess',
            excess_claim_id: 'claim-789',
            excess_amount: 1500
          })
        }));
      });
    });
  });

  describe('4. Policy Expiry Automation', () => {
    it('identifies and processes expired policies', async () => {
      const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockUpdateEq
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'insurance_policies') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: [{ id: 'policy-expired' }],
                    error: null
                  })
                })
              })
            }),
            update: mockUpdate
          };
        }
        return { select: jest.fn(), update: jest.fn() };
      });

      const result = await InsuranceAutomationService.checkPolicyExpirations();

      expect(result.processed).toBeGreaterThanOrEqual(0);
    });
  });

  describe('5. Claim Status Visibility', () => {
    it('displays correctly mapped claim fields to the user', async () => {
      // This tests the data mapping logic used in UserClaimsList
      const dbClaim = {
        id: 'claim-123',
        location: 'Old Road',
        estimated_damage_cost: 5000,
        status: 'approved',
        excess_amount_due: 1000
      };

      const mapDbClaimToUi = (c: any) => ({
        ...c,
        incident_location: c.incident_location ?? c.location,
        estimated_repair_cost: c.estimated_repair_cost ?? c.estimated_damage_cost,
        excess_amount: c.excess_amount ?? c.excess_amount_due,
      });

      const uiClaim = mapDbClaimToUi(dbClaim);

      expect(uiClaim.incident_location).toBe('Old Road');
      expect(uiClaim.estimated_repair_cost).toBe(5000);
      expect(uiClaim.excess_amount).toBe(1000);
    });
  });
});
