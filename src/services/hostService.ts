
import { supabase } from "@/integrations/supabase/client";

// Define a simple Host type for user profiles with location data
export interface Host {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
}

// Check if required location columns exist in the profiles table
const checkLocationColumns = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_sharing_location, latitude, longitude")
      .limit(1);

    if (error) {
      console.error("Error checking location columns:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("No profiles found to check columns");
      return false;
    }

    // Check if the needed columns exist in the first row of data
    const profile = data[0];
    return (
      profile !== null &&
      typeof profile === 'object' &&
      'latitude' in profile &&
      'longitude' in profile &&
      'is_sharing_location' in profile
    );
  } catch (error) {
    console.error("Error in checkLocationColumns:", error);
    return false;
  }
};

// Safely create a Host object from database data
const createSafeHost = (item: any): Host | null => {
  if (!item || typeof item !== 'object') return null;

  return {
    id: typeof item.id === 'string' ? item.id : '',
    full_name: item.full_name || null,
    avatar_url: item.avatar_url || null,
    latitude: typeof item.latitude === 'number' ? item.latitude : null,
    longitude: typeof item.longitude === 'number' ? item.longitude : null,
    updated_at: item.updated_at || null,
  };
};

// Get current session user's id
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
};

// Fetch all online hosts (users who are sharing their location)
export const fetchOnlineHosts = async (): Promise<Host[]> => {
  try {
    console.log("Fetching online hosts...");

    // First check if the required columns exist
    const columnsExist = await checkLocationColumns();
    if (!columnsExist) {
      console.error("Required location columns don't exist in profiles table");
      return [];
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, latitude, longitude, updated_at")
      .eq("is_sharing_location", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (error) {
      console.error("Error fetching online hosts:", error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      console.error("Expected array of hosts but got:", data);
      return [];
    }

    console.log(`Found ${data.length} online hosts`);

    // Create typed Host objects from the data
    const hosts: Host[] = [];
    for (const item of data) {
      const host = createSafeHost(item);
      if (host) hosts.push(host);
    }

    return hosts;
  } catch (error) {
    console.error("Error in fetchOnlineHosts:", error);
    return [];
  }
};

// Fetch a specific host by ID
export const fetchHostById = async (hostId: string): Promise<Host | null> => {
  try {
    console.log("Fetching host by ID:", hostId);

    // First check if the required columns exist
    const columnsExist = await checkLocationColumns();
    if (!columnsExist) {
      console.error("Required location columns don't exist in profiles table");
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, latitude, longitude, updated_at")
      .eq("id", hostId)
      .single();

    if (error) {
      console.error("Error fetching host:", error);
      return null;
    }

    if (!data) {
      console.error("No host found with ID:", hostId);
      return null;
    }

    // Create a typed Host object from the data
    return createSafeHost(data);
  } catch (error) {
    console.error("Error in fetchHostById:", error);
    return null;
  }
};
