
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Location } from "@/utils/mapbox/location/LocationManager";

/**
 * Save a location to the database
 */
export const saveLocation = async (
  location: Location, 
  carId?: string | null,
  sharingScope: 'none' | 'trip_only' | 'all' = 'none'
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return false;
    }

    const { error } = await supabase.from('locations').insert({
      user_id: user.id,
      car_id: carId || null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      heading: location.heading || null,
      speed: location.speed || null,
      altitude: location.altitude || null,
      altitude_accuracy: location.altitudeAccuracy || null,
      sharing_scope: sharingScope,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

    if (error) {
      console.error("Error saving location:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveLocation:", error);
    return false;
  }
};

/**
 * Get the latest location for a user
 */
export const getLatestUserLocation = async (userId: string): Promise<Location | null> => {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error("Error fetching latest user location:", error);
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy || undefined,
      heading: data.heading || undefined,
      speed: data.speed || undefined,
      altitude: data.altitude || undefined,
      altitudeAccuracy: data.altitude_accuracy || undefined
    };
  } catch (error) {
    console.error("Error in getLatestUserLocation:", error);
    return null;
  }
};

/**
 * Subscribe to a user's location updates
 */
export const subscribeToUserLocation = (
  userId: string, 
  callback: (location: Location) => void
) => {
  const channel = supabase
    .channel(`location-updates-${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'locations',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      const data = payload.new;
      const location: Location = {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy || undefined,
        heading: data.heading || undefined,
        speed: data.speed || undefined,
        altitude: data.altitude || undefined,
        altitudeAccuracy: data.altitude_accuracy || undefined
      };
      callback(location);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Get nearby user locations within a certain radius
 */
export const getNearbyLocations = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 20
): Promise<{userId: string, location: Location}[]> => {
  try {
    // Since we can't do geospatial queries directly in the client,
    // we'll fetch some locations and filter them
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('sharing_scope', 'all')
      .order('created_at', { ascending: false })
      .limit(100); // Fetch more than we need to filter

    if (error || !data) {
      console.error("Error fetching nearby locations:", error);
      return [];
    }

    // Import the distance calculation function
    const { calculateDistance } = await import('@/utils/distance');

    // Filter locations by distance
    const nearbyLocations = data
      .filter(loc => {
        const distance = calculateDistance(
          latitude, 
          longitude, 
          loc.latitude, 
          loc.longitude
        );
        return distance <= radiusKm;
      })
      .slice(0, limit)
      .map(loc => ({
        userId: loc.user_id,
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy || undefined,
          heading: loc.heading || undefined,
          speed: loc.speed || undefined
        }
      }));

    return nearbyLocations;
  } catch (error) {
    console.error("Error in getNearbyLocations:", error);
    return [];
  }
};
