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
            owner_id
          ),
          renter:profiles!renter_id (
            full_name
          ),
          host:cars!inner(
            owner:profiles!owner_id (
              full_name
            )
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

      // Check if handover sessions already exist for these bookings
      const bookingIds = bookings.map(b => b.id);
      const { data: existingSessions } = await supabase
        .from('handover_sessions')
        .select('booking_id, handover_completed')
        .in('booking_id', bookingIds);

      const existingSessionMap = new Map(
        existingSessions?.map(session => [session.booking_id, session]) || []
      );

      const prompts: HandoverPrompt[] = [];

      for (const booking of bookings) {
        const existingSession = existingSessionMap.get(booking.id);
        
        // Skip if handover is already completed
        if (existingSession?.handover_completed) {
          continue;
        }

        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.end_date);
        const isPickupDay = isToday(startDate);
        const isReturnDay = isToday(endDate);

        if (isPickupDay || isReturnDay) {
          const handoverType = isPickupDay ? 'pickup' : 'return';
          const now = new Date();
          
          // Determine urgency based on time proximity
          const targetTime = isPickupDay ? startDate : endDate;
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
            ? booking.host?.[0]?.owner?.full_name || 'Host'
            : booking.renter?.full_name || 'Renter';

          prompts.push({
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
          });
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