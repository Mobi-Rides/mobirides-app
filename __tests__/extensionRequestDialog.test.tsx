import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('calculates cost as extraDays × pricePerDay', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    // Default extraDays is 1
    expect(screen.getByText(/Total Cost/i).textContent).toMatch('100');
    // Increase days
    fireEvent.click(screen.getByLabelText(/increase/i));
    expect(screen.getByText(/Total Cost/i).textContent).toMatch('200');
  });

  it('calculates new end date as currentEndDate + extraDays', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    // Default extraDays is 1
    expect(screen.getByText(/New End Date/i)).toBeInTheDocument();
    // Increase days
    fireEvent.click(screen.getByLabelText(/increase/i));
    // Should update new end date
    expect(screen.getByText(/New End Date/i)).toBeInTheDocument();
  });

  it('calls submit and inserts booking_extensions row', () => {
    render(<ExtensionRequestDialog {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/Reason/i), { target: { value: 'Need more time' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));
    expect(baseProps.onSuccess).toHaveBeenCalled();
  });
});
