import { supabase } from "@/integrations/supabase/client";

interface Location {
  lat: number;
  lng: number;
  label?: string;
  hostId?: string; // Added hostId property
  carId?: string; // Added carId property
}

/**
 * Fetches hosts who are currently online and sharing their location
 * @returns Array of host locations with coordinates and labels
 */
export const fetchOnlineHosts = async (): Promise<Location[]> => {
  try {
    // Query the database for hosts who are online and sharing location
    const { data, error } = await supabase
      .from("cars")
      .select("id, latitude, longitude, owner_id")
      .eq("is_sharing_location", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      console.error("Error fetching online hosts:", error);
      return [];
    }

    if (!data || !data.length) {
      return [];
    }

    // Transform the data to the Location interface format
    return data.map((car) => ({
      lat: car.latitude,
      lng: car.longitude,
      label: `Car #${car.id}`,
      hostId: car.owner_id,
      carId: car.id,
    }));
  } catch (error) {
    console.error("Error in fetchOnlineHosts:", error);
    return [];
  }
};

/**
 * Fetches a specific host's location by their ID
 * @param hostId The ID of the host
 * @returns The host's location or null if not found
 */
export const fetchHostLocation = async (
  hostId: string
): Promise<Location | null> => {
  try {
    const { data, error } = await supabase
      .from("cars")
      .select(
        `
        id,
        latitude,
        longitude,
        owner_id
      `
      )
      .eq("owner_id", hostId)
      .eq("is_sharing_location", true)
      .single();

    if (error || !data) {
      console.error("Error fetching host location:", error);
      return null;
    }

    return {
      lat: data.latitude,
      lng: data.longitude,
      label: `Host #${hostId}`,
      hostId: hostId,
      carId: data.id,
    };
  } catch (error) {
    console.error("Error in fetchHostLocation:", error);
    return null;
  }
};
