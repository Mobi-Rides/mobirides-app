
import { supabase } from '@/integrations/supabase/client';
import { eventBus } from '@/utils/mapbox/core/eventBus';
import { toast } from 'sonner';
import { Location } from '@/utils/mapbox/location/LocationManager';

interface LocationUpdate {
  carId: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  scope: 'none' | 'trip_only' | 'all';
}

// Map to store active subscriptions by car ID
const activeSubscriptions = new Map<string, { subscription: any, userId: string }>();

/**
 * Subscribe to real-time location updates for a specific car
 */
export const subscribeToLocationUpdates = async (carId: string) => {
  try {
    // Check if we already have a subscription for this car
    if (activeSubscriptions.has(carId)) {
      console.log(`Already subscribed to updates for car ${carId}`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to subscribe to location updates");
      return;
    }

    console.log(`Subscribing to real-time location updates for car ${carId}`);

    // Set up real-time subscription
    const subscription = supabase
      .channel(`car-location-${carId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = subscription.presenceState();
        console.log('Current presence state:', state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('Join event:', key, newPresences);
        toast.success('Someone is now tracking this car location');
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('Leave event:', key, leftPresences);
        toast.info('Someone stopped tracking this car location');
      })
      .on('broadcast', { event: 'location-update' }, (payload) => {
        handleLocationUpdate(payload.payload as LocationUpdate);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track the user's presence in the channel
          await subscription.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          
          console.log(`Successfully subscribed to location updates for car ${carId}`);
          
          // Store the subscription reference
          activeSubscriptions.set(carId, { 
            subscription,
            userId: user.id
          });
        }
      });

  } catch (error) {
    console.error('Error subscribing to location updates:', error);
    toast.error('Failed to subscribe to location updates');
  }
};

/**
 * Unsubscribe from real-time location updates for a specific car
 */
export const unsubscribeFromLocationUpdates = (carId: string) => {
  try {
    const subscriptionData = activeSubscriptions.get(carId);
    if (!subscriptionData) {
      console.log(`No active subscription found for car ${carId}`);
      return;
    }

    console.log(`Unsubscribing from location updates for car ${carId}`);
    
    // Unsubscribe from the channel
    subscriptionData.subscription.unsubscribe();
    
    // Remove from active subscriptions
    activeSubscriptions.delete(carId);
    
    console.log(`Successfully unsubscribed from location updates for car ${carId}`);
  } catch (error) {
    console.error('Error unsubscribing from location updates:', error);
  }
};

/**
 * Broadcast location update to subscribers
 */
export const broadcastLocationUpdate = async (location: Location, carId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subscriptionData = activeSubscriptions.get(carId);
    if (!subscriptionData || subscriptionData.userId !== user.id) {
      console.log('No active subscription or not the owner, not broadcasting');
      return;
    }

    const update: LocationUpdate = {
      carId,
      userId: user.id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      scope: 'all', // This could be dynamic based on context
    };

    console.log('Broadcasting location update:', update);
    
    // Broadcast update to channel
    const subscription = subscriptionData.subscription;
    await subscription.send({
      type: 'broadcast',
      event: 'location-update',
      payload: update,
    });
    
    console.log('Location update broadcast successful');
  } catch (error) {
    console.error('Error broadcasting location update:', error);
  }
};

/**
 * Handle incoming location updates
 */
const handleLocationUpdate = (update: LocationUpdate) => {
  console.log('Received location update:', update);
  
  // Emit event for components to react to
  eventBus.emit({
    type: 'realtimeLocationUpdate',
    payload: {
      carId: update.carId,
      location: {
        latitude: update.latitude,
        longitude: update.longitude,
        accuracy: update.accuracy
      },
      userId: update.userId,
      timestamp: update.timestamp
    }
  });
};
