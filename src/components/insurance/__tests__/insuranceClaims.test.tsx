import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, jest } from '@jest/globals';
import ClaimsSubmissionForm from '../ClaimsSubmissionForm';
import UserClaimsList from '../UserClaimsList';
import AdminClaimsDashboard from '../AdminClaimsDashboard';

// Mock the auth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock the insurance service
jest.mock('../../../services/insuranceService', () => ({
  InsuranceService: {
    submitClaim: jest.fn().mockResolvedValue({ success: true }),
    getInsurancePackages: jest.fn().mockResolvedValue([
      { id: '1', name: 'Basic', premium_percentage: 0.05, coverage_cap: 50000 },
      { id: '2', name: 'Standard', premium_percentage: 0.08, coverage_cap: 100000 },
    ]),
  },
}));

// Mock supabase
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-file.jpg' }, error: null }),
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      auth: {
        admin: {
          listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        },
      },
    })),
  },
}));

describe('Insurance Claims Components', () => {
  describe('ClaimsSubmissionForm', () => {
    it('renders the form with all required fields', () => {
      render(
        <BrowserRouter>
          <ClaimsSubmissionForm 
            policyId="test-policy-id" 
            bookingId="test-booking-id" 
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Submit Insurance Claim')).toBeInTheDocument();
      expect(screen.getByText('Incident Details')).toBeInTheDocument();
      expect(screen.getByText('Damage Assessment')).toBeInTheDocument();
      expect(screen.getByText('Documents & Submit')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(
        <BrowserRouter>
          <ClaimsSubmissionForm 
            policyId="test-policy-id" 
            bookingId="test-booking-id" 
          />
        </BrowserRouter>
      );

      // Try to submit without filling required fields
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Incident date is required')).toBeInTheDocument();
      });
    });
  });

  describe('UserClaimsList', () => {
    it('renders the claims list component', () => {
      render(
        <BrowserRouter>
          <UserClaimsList />
        </BrowserRouter>
      );

      expect(screen.getByText('My Insurance Claims')).toBeInTheDocument();
      expect(screen.getByText('View and manage your insurance claims')).toBeInTheDocument();
    });

    it('shows new claim button', () => {
      render(
        <BrowserRouter>
          <UserClaimsList />
        </BrowserRouter>
      );

      expect(screen.getByText('New Claim')).toBeInTheDocument();
    });
  });

  describe('AdminClaimsDashboard', () => {
    it('renders the admin dashboard', () => {
      render(
        <BrowserRouter>
          <AdminClaimsDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Insurance Claims Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage and review insurance claims')).toBeInTheDocument();
    });

    it('displays statistics cards', () => {
      render(
        <BrowserRouter>
          <AdminClaimsDashboard />
        </BrowserRouter>
      );

      expect(screen.getByText('Total Claims')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });
});