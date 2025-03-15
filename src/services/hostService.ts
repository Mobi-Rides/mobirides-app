
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
    // First check if the required columns exist
    const { data: columnCheck, error: columnError } = await supabase
      .from("profiles")
      .select("is_sharing_location, latitude, longitude")
      .limit(1);
    
    // Check if columns exist in returned data
    const hasLocationFields = columnCheck && 
      columnCheck.length > 0 && 
      'latitude' in columnCheck[0] && 
      'longitude' in columnCheck[0] &&
      'is_sharing_location' in columnCheck[0];
    
    if (columnError || !hasLocationFields) {
      console.error("Required columns don't exist:", columnError);
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

    if (!data) {
      return [];
    }

    // Filter out any non-object entries and ensure they match our Host interface
    return data.filter((item): item is Host => {
      return item !== null && 
        typeof item === 'object' && 
        'id' in item && 
        'latitude' in item && 
        'longitude' in item;
    });
  } catch (error) {
    console.error("Error in fetchOnlineHosts:", error);
    return [];
  }
};

// Fetch a specific host by ID
export const fetchHostById = async (hostId: string): Promise<Host | null> => {
  try {
    // First check if the required columns exist
    const { data: columnCheck, error: columnError } = await supabase
      .from("profiles")
      .select("latitude, longitude")
      .limit(1);
    
    // Check if columns exist in returned data
    const hasLocationFields = columnCheck && 
      columnCheck.length > 0 && 
      'latitude' in columnCheck[0] && 
      'longitude' in columnCheck[0];
    
    if (columnError || !hasLocationFields) {
      console.error("Required columns don't exist:", columnError);
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
      return null;
    }

    // Verify that the data has the properties we expect
    if (data && 
        typeof data === 'object' &&
        'id' in data &&
        'latitude' in data &&
        'longitude' in data) {
      return data as Host;
    }
    
    return null;
  } catch (error) {
    console.error("Error in fetchHostById:", error);
    return null;
  }
};
