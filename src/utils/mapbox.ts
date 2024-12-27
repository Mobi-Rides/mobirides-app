import { supabase } from "@/integrations/supabase/client";

export const getMapboxToken = async () => {
  try {
    console.log('Fetching Mapbox token...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('Error fetching Mapbox token:', error);
      return null;
    }
    
    console.log('Mapbox token retrieved:', data?.token ? 'Token exists' : 'No token found');
    return data?.token;
  } catch (error) {
    console.error('Error invoking function:', error);
    return null;
  }
};