import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isAfter, isBefore, addHours, subHours } from "date-fns";

export interface HandoverPrompt {
  id: string;
  bookingId: string;
  carId: string;
  handoverType: 'pickup' | 'return';
  isUrgent: boolean;
  urgencyLevel: 'morning' | 'soon' | 'immediate';
  carBrand: string;
  carModel: string;
  startDate: Date;
  endDate: Date;
  userRole: 'host' | 'renter';
  shouldInitiate: boolean;
  otherPartyName: string;
  location: string;
}

// Simplified booking type for prompts
interface PromptBooking {
  id: string;
  car_id: string;
  start_date: string;
  end_date: string;
  status: string;
  cars: {
    brand: string;
    model: string;
    location: string;
    owner_id: string;
    image_url?: string;
    price_per_day?: number;
    owner?: {
      full_name: string;
    };
  };
  renter?: {
    full_name: string;
  };
}

export class HandoverPromptService {
  static async detectHandoverPrompts(userId: string, userRole: 'host' | 'renter'): Promise<HandoverPrompt[]> {
    const { logger } = await import("@/utils/logger");
    
    try {
      if (!userId || !userRole) {
        logger.debug("detectHandoverPrompts: No userId or userRole provided");
        return [];
      }
      
      logger.debug(`Detecting handover prompts for ${userRole}:`, userId);
    
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      let query = supabase
        .from('bookings')
        .select(`
          id,
          car_id,
          start_date,
          end_date,
          status,
          cars (
            brand,
            model,
            location,
            owner_id,
            image_url,
            price_per_day,
            owner:profiles!owner_id (
              full_name
            )
          ),
          renter:profiles!renter_id (
            full_name
          )
        `)
        .eq('status', 'confirmed')
        .or(`start_date.eq.${format(today, 'yyyy-MM-dd')},end_date.eq.${format(today, 'yyyy-MM-dd')}`);

      if (userRole === 'host') {
        // For hosts, get bookings for their cars
        const { data: userCars } = await supabase
          .from('cars')
          .select('id')
          .eq('owner_id', userId);
        
        if (!userCars?.length) return [];
        
        const carIds = userCars.map(car => car.id);
        query = query.in('car_id', carIds);
      } else {
        // For renters, get their bookings
        query = query.eq('renter_id', userId);
      }

      const { data: bookings, error } = await query;

      if (error) {
        logger.error('Error fetching handover prompts:', error);
        throw new Error(`Failed to fetch handover prompts: ${error.message}`);
      }

      if (!bookings?.length) {
        logger.debug('No bookings found for handover prompts');
        return [];
      }

      // Check handover session states for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: handoverSessions } = await supabase
        .from('handover_sessions')
        .select(`
          booking_id, 
          handover_completed,
          created_at,
          handover_step_completion (
            step_name,
            is_completed,
            step_order
          )
        `)
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: true });

      // Group sessions by booking_id and determine states
      const bookingSessionMap = new Map();
      handoverSessions?.forEach(session => {
        if (!bookingSessionMap.has(session.booking_id)) {
          bookingSessionMap.set(session.booking_id, []);
        }
        bookingSessionMap.get(session.booking_id).push(session);
      });

      const prompts: HandoverPrompt[] = [];

      for (const booking of bookings) {
        const sessions = bookingSessionMap.get(booking.id) || [];
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        const isPickupDay = isToday(startDate);
        const isReturnDay = isToday(endDate);
        
        // Separate pickup and return sessions based on creation date relative to booking dates
        const pickupSessions = sessions.filter(session => {
          const sessionDate = new Date(session.created_at);
          // Pickup sessions are created on or before the rental period
          return sessionDate <= new Date(endDate.getTime() + 24 * 60 * 60 * 1000); // Allow day after end for late sessions
        });
        
        const returnSessions = sessions.filter(session => {
          const sessionDate = new Date(session.created_at);
          // Return sessions are created on or after the end date
          return sessionDate >= new Date(endDate.getTime());
        });
        
        // Check pickup completion - any pickup session that's completed
        const pickupCompleted = pickupSessions.some(session => 
          session.handover_completed || 
          (session.handover_step_completion?.length > 0 && 
           session.handover_step_completion.every(step => step.is_completed))
        );
        
        // Check return completion - any return session that's completed  
        const returnCompleted = returnSessions.some(session => 
          session.handover_completed || 
          (session.handover_step_completion?.length > 0 && 
           session.handover_step_completion.every(step => step.is_completed))
        );

        // Skip if both handovers are completed
        if (pickupCompleted && returnCompleted) {
          continue;
        }

        // Show pickup prompt if it's pickup day and pickup not completed
        if (isPickupDay && !pickupCompleted) {
          prompts.push(this.createHandoverPrompt(booking as PromptBooking, 'pickup', userRole));
        }
        
        // Show return prompt if it's return day and pickup completed but return not completed
        if (isReturnDay && pickupCompleted && !returnCompleted) {
          prompts.push(this.createHandoverPrompt(booking as PromptBooking, 'return', userRole));
        }
      }

      logger.debug(`Found ${prompts.length} handover prompts for ${userRole}`);
      return prompts;
    } catch (error) {
      logger.error('Error in detectHandoverPrompts:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  private static createHandoverPrompt(booking: PromptBooking, handoverType: 'pickup' | 'return', userRole: 'host' | 'renter'): HandoverPrompt {
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const now = new Date();
    
    // Determine urgency based on time proximity
    const targetTime = handoverType === 'pickup' ? startDate : endDate;
    const hoursUntil = (targetTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let urgencyLevel: 'morning' | 'soon' | 'immediate' = 'morning';
    let isUrgent = false;

    if (hoursUntil <= 0.5) {
      urgencyLevel = 'immediate';
      isUrgent = true;
    } else if (hoursUntil <= 2) {
      urgencyLevel = 'soon';
      isUrgent = true;
    } else if (hoursUntil <= 8) {
      urgencyLevel = 'morning';
      isUrgent = false;
    }

    // Determine who should initiate based on handover type and role
    let shouldInitiate = false;
    if (handoverType === 'pickup' && userRole === 'renter') {
      shouldInitiate = true; // Renter initiates pickup
    } else if (handoverType === 'return' && userRole === 'renter') {
      shouldInitiate = true; // Renter initiates return
    }

    // Get the other party's name
    const otherPartyName = userRole === 'renter' 
      ? booking.cars.owner?.full_name || 'Host'
      : booking.renter?.full_name || 'Renter';

    return {
      id: booking.id,
      bookingId: booking.id,
      carId: booking.car_id,
      handoverType,
      isUrgent,
      urgencyLevel,
      carBrand: booking.cars.brand,
      carModel: booking.cars.model,
      startDate,
      endDate,
      userRole,
      shouldInitiate,
      otherPartyName,
      location: booking.cars.location
    };
  }

  static getUrgencyMessage(prompt: HandoverPrompt): string {
    const timeRef = prompt.handoverType === 'pickup' ? 'pickup' : 'return';
    
    switch (prompt.urgencyLevel) {
      case 'immediate':
        return `🚨 URGENT: ${prompt.handoverType} time is now!`;
      case 'soon':
        return `⏰ ${prompt.handoverType.charAt(0).toUpperCase() + prompt.handoverType.slice(1)} in less than 2 hours`;
      case 'morning':
        return `📅 ${prompt.handoverType.charAt(0).toUpperCase() + prompt.handoverType.slice(1)} today`;
      default:
        return `${prompt.handoverType.charAt(0).toUpperCase() + prompt.handoverType.slice(1)} today`;
    }
  }

  static getActionMessage(prompt: HandoverPrompt): string {
    if (prompt.shouldInitiate) {
      return prompt.handoverType === 'pickup' 
        ? `Start pickup process with ${prompt.otherPartyName}`
        : `Start return process with ${prompt.otherPartyName}`;
    } else {
      return prompt.handoverType === 'pickup'
        ? `Prepare for pickup by ${prompt.otherPartyName}`
        : `Prepare for return from ${prompt.otherPartyName}`;
    }
  }
}