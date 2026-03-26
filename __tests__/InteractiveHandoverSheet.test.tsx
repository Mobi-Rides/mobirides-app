
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InteractiveHandoverSheet } from '../src/components/handover/interactive/InteractiveHandoverSheet';
import { useInteractiveHandover } from '../src/hooks/useInteractiveHandover';

// Mock the hook
jest.mock('../src/hooks/useInteractiveHandover', () => ({
  useInteractiveHandover: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock child components to simplify testing
jest.mock('../src/components/handover/interactive/WaitingCard', () => ({
  WaitingCard: ({ waitingFor }) => <div data-testid="waiting-card">Waiting for {waitingFor}</div>
}));

// Mock step components
jest.mock('../src/components/handover/interactive/steps/LocationSelectionStep', () => ({
  LocationSelectionStep: ({ onComplete }) => (
    <div data-testid="step-location-selection">
      <button onClick={() => onComplete({ location: 'test' })}>Complete Location</button>
    </div>
  )
}));

jest.mock('../src/components/handover/interactive/steps/IdentityVerificationStep', () => ({
  IdentityVerificationStep: ({ onComplete, userRole }) => (
    <div data-testid="step-identity-verification">
      Identity Verification ({userRole})
      <button onClick={() => onComplete({ verified: true })}>Verify Identity</button>
    </div>
  )
}));

jest.mock('../src/components/handover/interactive/steps/EnRouteStep', () => ({
  EnRouteStep: ({ onConfirm }) => (
    <div data-testid="step-en-route">
      <button onClick={onConfirm}>Confirm En Route</button>
    </div>
  )
}));

jest.mock('../src/components/handover/interactive/steps/ArrivalConfirmationStep', () => ({
  ArrivalConfirmationStep: ({ onConfirm }) => (
    <div data-testid="step-arrival">
      <button onClick={onConfirm}>Confirm Arrival</button>
    </div>
  )
}));

jest.mock('../src/components/handover/interactive/steps/LocationConfirmationStep', () => ({
  LocationConfirmationStep: ({ onConfirm }) => (
    <div data-testid="step-location-confirmation">
      <button onClick={onConfirm}>Confirm Location</button>
    </div>
  )
}));

describe('InteractiveHandoverSheet Component', () => {
  const mockAdvanceStep = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: null,
      loading: true,
      error: null,
      isMyTurn: false,
      advanceStep: mockAdvanceStep,
      userRole: 'host'
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    
    // Check for the "Initializing" text which is present in the loader component
    expect(screen.getByText((content) => content.includes('Initializing secure handover session'))).toBeInTheDocument();
  });

  test('renders error state', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: null,
      loading: false,
      error: 'Failed to load session',
      isMyTurn: false,
      advanceStep: mockAdvanceStep,
      userRole: 'host',
      steps: [],
      session: null
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Session Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load session')).toBeInTheDocument();
  });

  test('renders waiting card when it is not user turn', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: {
        name: 'location_selection',
        order: 1,
        title: 'Location Selection',
        description: 'Host selects location',
        owner: 'host'
      },
      loading: false,
      error: null,
      isMyTurn: false, // It's NOT my turn
      advanceStep: mockAdvanceStep,
      userRole: 'renter', // I am renter, but step is host
      steps: [{ name: 'location_selection' }],
      session: { id: 'test-session' }
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('waiting-card')).toBeInTheDocument();
    expect(screen.getByText('Waiting for host')).toBeInTheDocument();
  });

  test('renders correct step component when it is user turn', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: {
        name: 'location_selection',
        order: 1,
        title: 'Location Selection',
        description: 'Host selects location',
        owner: 'host'
      },
      loading: false,
      error: null,
      isMyTurn: true, // It IS my turn
      advanceStep: mockAdvanceStep,
      userRole: 'host',
      steps: [{ name: 'location_selection' }],
      session: { id: 'test-session' }
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    expect(screen.getByTestId('step-location-selection')).toBeInTheDocument();
  });

  test('calls advanceStep when step is completed', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: {
        name: 'location_selection',
        order: 1,
        title: 'Location Selection',
        description: 'Host selects location',
        owner: 'host'
      },
      loading: false,
      error: null,
      isMyTurn: true,
      advanceStep: mockAdvanceStep,
      userRole: 'host',
      steps: [{ name: 'location_selection' }],
      session: { id: 'test-session' }
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    
    const completeButton = screen.getByText('Complete Location');
    fireEvent.click(completeButton);

    expect(mockAdvanceStep).toHaveBeenCalledWith({ location: 'test' });
  });

  test('passes userRole correctly to step components', () => {
    (useInteractiveHandover as jest.Mock).mockReturnValue({
      currentStep: {
        name: 'identity_verification',
        order: 6,
        title: 'Identity Verification',
        description: 'Verify identity',
        owner: 'host'
      },
      loading: false,
      error: null,
      isMyTurn: true,
      advanceStep: mockAdvanceStep,
      userRole: 'host',
      steps: [{ name: 'identity_verification' }],
      session: { id: 'test-session' }
    });

    render(<InteractiveHandoverSheet sessionId="test-session" isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Identity Verification (host)')).toBeInTheDocument();
  });
});
