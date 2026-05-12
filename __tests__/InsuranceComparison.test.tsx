import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InsuranceComparison } from '../src/components/insurance/InsuranceComparison';
import { InsuranceService } from '../src/services/insuranceService';

// Mock the InsuranceService
jest.mock('../src/services/insuranceService', () => ({
  InsuranceService: {
    calculateAllPremiums: jest.fn()
  }
}));

const mockCalculations = [
  {
    packageId: '0',
    packageName: 'no_coverage',
    displayName: 'No Coverage',
    description: 'Full liability',
    dailyRentalAmount: 500,
    premiumPercentage: 0,
    premiumPerDay: 0,
    numberOfDays: 3,
    totalPremium: 0,
    coverageCap: 0,
    excessAmount: 0,
    excessPercentage: 0,
    coversMinorDamage: false,
    coversMajorIncidents: false,
    features: ['Lowest cost'],
    exclusions: ['Everything'],
    isFlatDailyRate: false
  },
  {
    packageId: '1',
    packageName: 'basic',
    displayName: 'Basic Coverage',
    description: 'Minor damage protection',
    dailyRentalAmount: 500,
    premiumPercentage: 0.1,
    premiumPerDay: 80,
    numberOfDays: 3,
    totalPremium: 240,
    coverageCap: 8000,
    excessAmount: 300,
    excessPercentage: 0.2,
    coversMinorDamage: true,
    coversMajorIncidents: false,
    features: ['Windscreen', 'Tyres'],
    exclusions: ['Theft', 'Collision'],
    isFlatDailyRate: true
  },
  {
    packageId: '3',
    packageName: 'premium',
    displayName: 'Premium Coverage',
    description: 'Maximum protection',
    dailyRentalAmount: 500,
    premiumPercentage: 0.3,
    premiumPerDay: 250,
    numberOfDays: 3,
    totalPremium: 750,
    coverageCap: 50000,
    excessAmount: 500,
    excessPercentage: 0.1,
    coversMinorDamage: true,
    coversMajorIncidents: true,
    features: ['Reduced Excess', 'Priority Support'],
    exclusions: [],
    isFlatDailyRate: true
  }
];

describe('InsuranceComparison', () => {
  const defaultProps = {
    dailyRentalAmount: 500,
    startDate: new Date('2026-05-10'),
    endDate: new Date('2026-05-13'),
    onSelectPackage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (InsuranceService.calculateAllPremiums as jest.Mock).mockResolvedValue(mockCalculations);
  });

  it('renders the comparison grid with tiers', async () => {
    render(<InsuranceComparison {...defaultProps} />);

    // Wait for data to load
    expect(await screen.findByText('Basic Coverage')).toBeInTheDocument();
    expect(screen.getByText('Premium Coverage')).toBeInTheDocument();

    // Check for daily premiums
    expect(screen.getByText('P 80 / day × 3 days')).toBeInTheDocument();
    expect(screen.getByText('P 250 / day × 3 days')).toBeInTheDocument();
  });

  it('highlights the recommended tier', async () => {
    render(<InsuranceComparison {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });
  });

  it('calls onSelectPackage when a select button is clicked', async () => {
    render(<InsuranceComparison {...defaultProps} />);

    const selectButtons = await screen.findAllByRole('button', { name: /Select/ });
    fireEvent.click(selectButtons[1]); // Click Basic (index 1 in our mock grid if filtered)

    expect(defaultProps.onSelectPackage).toHaveBeenCalled();
  });

  it('shows tooltips for terms', async () => {
    render(<InsuranceComparison {...defaultProps} />);

    await screen.findByText('Basic Coverage');
    expect(screen.getAllByText('Excess')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Coverage Cap')[0]).toBeInTheDocument();
  });
});

