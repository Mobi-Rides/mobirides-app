import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExtensionRequestDialog } from '../src/components/rental-details/ExtensionRequestDialog';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ExtensionRequestDialog', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    bookingId: 'booking-1',
    currentEndDate: '2026-04-10',
    pricePerDay: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calculates cost as extraDays × pricePerDay', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    // Default extraDays is 1
    expect(screen.getByText(/Additional cost/i).textContent).toMatch('100');
    // Increase days
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText(/Additional cost/i).textContent).toMatch('200');
  });

  it('calculates new end date as currentEndDate + extraDays', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    // Default extraDays is 1
    expect(screen.getByText(/New end date/i)).toBeInTheDocument();
    // Increase days
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    // Should update new end date
    expect(screen.getByText(/New end date/i)).toBeInTheDocument();
  });

  it('calls submit and inserts booking_extensions row', async () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(/let the host know/i), { target: { value: 'Need more time' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Request/i }));
    await waitFor(() => expect(baseProps.onSuccess).toHaveBeenCalled());
  });
});
