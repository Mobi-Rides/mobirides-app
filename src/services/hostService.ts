
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
    
    const hasLocationFields = firstRow && 
      'latitude' in firstRow && 
      'longitude' in firstRow &&
      'is_sharing_location' in firstRow;
    
    if (!hasLocationFields) {
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

    // Cast the data as unknown first and then to Host[] to handle potential type mismatches
    const safeData = data as unknown as Record<string, any>[];
    
    // Filter out any entries that don't match our Host interface
    return safeData.filter((item): item is Host => {
      if (!item) return false;
      
      return typeof item === 'object' && 
        'id' in item && 
        typeof item.id === 'string' &&
        'latitude' in item && 
        'longitude' in item;
    }) as Host[];
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
    
    const hasLocationFields = 
      'latitude' in firstRow && 
      'longitude' in firstRow;
    
    if (!hasLocationFields) {
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

    // Verify that the data has the required properties
    if (data && 
        typeof data === 'object' &&
        'id' in data &&
        typeof data.id === 'string' &&
        'latitude' in data &&
        'longitude' in data) {
      return data as Host;
    }
    
    console.error("Host data doesn't match expected structure:", data);
    return null;
  } catch (error) {
    console.error("Error in fetchHostById:", error);
    return null;
  }
};
