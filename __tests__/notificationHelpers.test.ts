import { normalizeNotification } from '@/utils/notificationHelpers';

describe('normalizeNotification', () => {
  it('normalizes a full notification and extracts booking car details', () => {
    const input = {
      id: 10,
      user_id: 'user-1',
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      description: 'Your booking is confirmed',
      content: 'Content',
      is_read: true,
      created_at: '2026-04-01T10:00:00Z',
      updated_at: '2026-04-01T10:30:00Z',
      expires_at: null,
      metadata: { booking_ref: 'ABC123' },
      role_target: 'renter',
      related_booking_id: 'b1',
      related_car_id: 'c1',
      bookings: { cars: { brand: 'Toyota', model: 'Corolla' } },
    } as any;

    const result = normalizeNotification(input);

    expect(result.id).toBe(10);
    expect(result.user_id).toBe('user-1');
    expect(result.type).toBe('booking_confirmed');
    expect(result.is_read).toBe(true);
    expect(result.metadata).toEqual({ booking_ref: 'ABC123' });
    expect(result.bookings).toEqual({ brand: 'Toyota', model: 'Corolla' });
  });

  it('applies fallback values for nullable fields', () => {
    const input = {
      id: 11,
      user_id: null,
      type: 'system_alert',
      title: null,
      description: null,
      content: 'Fallback content',
      is_read: null,
      created_at: null,
      updated_at: null,
      expires_at: null,
      metadata: null,
      role_target: null,
      related_booking_id: null,
      related_car_id: null,
      bookings: {},
    } as any;

    const result = normalizeNotification(input);

    expect(result.user_id).toBe('');
    expect(result.title).toBe('');
    expect(result.description).toBe('Fallback content');
    expect(result.content).toBe('Fallback content');
    expect(result.is_read).toBe(false);
    expect(result.role_target).toBe('system_wide');
    expect(result.metadata).toEqual({});
    expect(result.bookings).toBeNull();
    expect(typeof result.created_at).toBe('string');
    expect(typeof result.updated_at).toBe('string');
  });

  it('uses title as final fallback for description and content', () => {
    const input = {
      id: 12,
      user_id: 'u',
      type: 'system_alert',
      title: 'Only title available',
      description: null,
      content: null,
      is_read: false,
      created_at: '2026-04-01T11:00:00Z',
      updated_at: null,
      expires_at: null,
      metadata: {},
      role_target: 'system_wide',
      related_booking_id: null,
      related_car_id: null,
    } as any;

    const result = normalizeNotification(input);

    expect(result.description).toBe('Only title available');
    expect(result.content).toBe('Only title available');
    expect(result.updated_at).toBe('2026-04-01T11:00:00Z');
  });
});
