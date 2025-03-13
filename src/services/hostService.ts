
import { supabase } from "@/integrations/supabase/client";

// Define a simple Host type to avoid deep type instantiation errors
interface Host {
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

    return data as Host[] || [];
  } catch (error) {
    console.error("Error in fetchOnlineHosts:", error);
    return [];
  }
};

// Fetch a specific host by ID
export const fetchHostById = async (hostId: string): Promise<Host | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, latitude, longitude, updated_at")
      .eq("id", hostId)
      .single();

    if (error) {
      console.error("Error fetching host:", error);
      return null;
    }

    return data as Host;
  } catch (error) {
    console.error("Error in fetchHostById:", error);
    return null;
  }
};
