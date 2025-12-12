import { supabase } from "@/integrations/supabase/client";

export interface CarBlockedDate {
  id: string;
  car_id: string;
  blocked_date: string;
  reason: string | null;
}

export interface AvailabilityData {
  date: Date;
  status: 'available' | 'booked' | 'blocked' | 'past';
  bookingId?: string;
  reason?: string;
}

export async function getCarBlockedDates(carId: string): Promise<CarBlockedDate[]> {
  const { data, error } = await supabase
    .from('car_blocked_dates')
    .select('*')
    .eq('car_id', carId);

  if (error) throw error;
  return data as CarBlockedDate[];
}

export async function blockCarDates(carId: string, dates: Date[], reason?: string): Promise<void> {
  const inserts = dates.map(date => {
    // Use local date string to avoid timezone shifts
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return {
      car_id: carId,
      blocked_date: localDate.toISOString().split('T')[0], // YYYY-MM-DD
      reason: reason || 'Blocked by host'
    };
  });

  const { error } = await supabase
    .from('car_blocked_dates')
    .insert(inserts);

  if (error) {
    // If duplicate key error, we can ignore it (it's already blocked) or throw
    if (error.code === '23505') {
      console.warn('Date already blocked, ignoring duplicate.');
      return;
    }
    throw error;
  }
}

export async function unblockCarDates(carId: string, dates: Date[]): Promise<void> {
  const dateStrings = dates.map(date => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  });
  
  const { error } = await supabase
    .from('car_blocked_dates')
    .delete()
    .eq('car_id', carId)
    .in('blocked_date', dateStrings);

  if (error) throw error;
}

// Helper to get full availability (bookings + blocked)
export async function getCarAvailability(carId: string, month: Date): Promise<AvailabilityData[]> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString();

  // 1. Get Bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, start_date, end_date')
    .eq('car_id', carId)
    .neq('status', 'cancelled')
    .or(`start_date.lte.${endOfMonth},end_date.gte.${startOfMonth}`);

  // 2. Get Blocked Dates
  const { data: blocked } = await supabase
    .from('car_blocked_dates')
    .select('blocked_date, reason')
    .eq('car_id', carId)
    .gte('blocked_date', startOfMonth)
    .lte('blocked_date', endOfMonth);

  const availability: AvailabilityData[] = [];
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(month.getFullYear(), month.getMonth(), i);
    const dateStr = currentDate.toISOString().split('T')[0];
    let status: 'available' | 'booked' | 'blocked' | 'past' = 'available';
    let bookingId: string | undefined;
    let reason: string | undefined;

    // Check if past
    if (currentDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      status = 'past';
    }

    // Check bookings (override past if we want to see history, but usually we care about availability)
    // Actually, for calendar view, we want to see bookings even in the past? Maybe. 
    // Let's prioritize showing "booked" status over "past" for visual clarity if needed, 
    // but typically "past" is grayed out. 
    // The requirement says "Red: Past dates (non-interactive)".
    
    // Check blocked
    const blockEntry = blocked?.find(b => b.blocked_date === dateStr);
    if (blockEntry) {
      status = 'blocked';
      reason = blockEntry.reason || undefined;
    }

    // Check booked (overrides blocked if they somehow overlap, though they shouldn't)
    const booking = bookings?.find(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      // Normalize times to compare dates only
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return currentDate >= start && currentDate <= end;
    });

    if (booking) {
      status = 'booked';
      bookingId = booking.id;
    }

    // Enforce past status if it's not today or future (unless we want to see past bookings?)
    // Let's stick to the requirement: Red: Past dates
    if (currentDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      status = 'past';
    }

    availability.push({
      date: currentDate,
      status,
      bookingId,
      reason
    });
  }

  return availability;
}

export async function getCarSchedule(carId: string) {
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, start_date, end_date')
    .eq('car_id', carId)
    .neq('status', 'cancelled'); // Get all valid bookings

  if (bookingsError) throw bookingsError;

  const { data: blocked, error: blockedError } = await supabase
    .from('car_blocked_dates')
    .select('blocked_date, reason')
    .eq('car_id', carId);

  if (blockedError) throw blockedError;

  return {
    bookings: bookings || [],
    blocked: blocked || []
  };
}
