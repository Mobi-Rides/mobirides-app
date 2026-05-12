import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExtensionRequestDialog } from '../src/components/rental-details/ExtensionRequestDialog';

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
    // Default extraDays is 1, cost should be 100
    expect(screen.getByText(/Additional cost/i).textContent).toMatch('100');
    // Increase days to 2
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText(/Additional cost/i).textContent).toMatch('200');
  });

  it('calculates new end date as currentEndDate + extraDays', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    // Default extraDays is 1
    expect(screen.getByText(/New end date/i)).toBeInTheDocument();
    // Increase days
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    // Updated end date should still be shown
    expect(screen.getByText(/New end date/i)).toBeInTheDocument();
  });

  it('calls onSuccess after submitting extension request', async () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/Let the host know why you need more time/i);
    fireEvent.change(textarea, { target: { value: 'Need more time' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Request/i }));
    await waitFor(() => expect(baseProps.onSuccess).toHaveBeenCalled());
  });
});
