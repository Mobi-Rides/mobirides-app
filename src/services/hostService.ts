
import { supabase } from "@/integrations/supabase/client";

// Define a simple Host type to avoid deep type instantiation errors
export interface Host {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
}

// Fetch all online hosts (users who are sharing their location)
export const fetchOnlineHosts = async (): Promise<Host[]> => {
  try {
    console.log("Fetching online hosts...");
    
    // First check if the required columns exist
    const { data: columnCheck, error: columnError } = await supabase
      .from("profiles")
      .select("is_sharing_location, latitude, longitude")
      .limit(1);
    
    if (columnError) {
      console.error("Error checking columns:", columnError);
      return [];
    }
    
    // Check if columns exist in returned data
    if (!columnCheck || columnCheck.length === 0) {
      console.error("No profiles found to check columns");
      return [];
    }
    
    const firstRow = columnCheck[0];
    if (!firstRow) {
      console.error("No row data in column check");
      return [];
    }
    
    // Check if the required columns exist in the database
    if (!('latitude' in firstRow) || 
        !('longitude' in firstRow) || 
        !('is_sharing_location' in firstRow)) {
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

    // Convert data to Host[] with explicit type safety
    const hosts: Host[] = [];
    
    for (const item of data) {
      if (item && 
          typeof item === 'object' && 
          'id' in item && 
          typeof item.id === 'string') {
        hosts.push({
          id: item.id,
          full_name: 'full_name' in item ? item.full_name : null,
          avatar_url: 'avatar_url' in item ? item.avatar_url : null,
          latitude: 'latitude' in item ? item.latitude : null,
          longitude: 'longitude' in item ? item.longitude : null,
          updated_at: 'updated_at' in item ? item.updated_at : null
        });
      }
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
    const { data: columnCheck, error: columnError } = await supabase
      .from("profiles")
      .select("latitude, longitude")
      .limit(1);
    
    if (columnError) {
      console.error("Error checking columns:", columnError);
      return null;
    }
    
    // Check if columns exist in returned data
    if (!columnCheck || columnCheck.length === 0) {
      console.error("No profiles found to check columns");
      return null;
    }
    
    const firstRow = columnCheck[0];
    if (!firstRow) {
      console.error("No row data in column check");
      return null;
    }
    
    // Check if the required columns exist in the database
    if (!('latitude' in firstRow) || !('longitude' in firstRow)) {
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

    // Create a valid Host object with safe property access
    if (typeof data === 'object' && 'id' in data && typeof data.id === 'string') {
      return {
        id: data.id,
        full_name: 'full_name' in data ? data.full_name : null,
        avatar_url: 'avatar_url' in data ? data.avatar_url : null,
        latitude: 'latitude' in data ? data.latitude : null,
        longitude: 'longitude' in data ? data.longitude : null,
        updated_at: 'updated_at' in data ? data.updated_at : null
      };
    }
    
    console.error("Host data doesn't match expected structure:", data);
    return null;
  } catch (error) {
    console.error("Error in fetchHostById:", error);
    return null;
  }
};
