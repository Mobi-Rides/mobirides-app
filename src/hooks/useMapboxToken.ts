import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('Fetching Mapbox token from edge function...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching token:', error);
          setError(error.message);
          setToken(null);
          return;
        }

        if (!data?.token) {
          console.log('No token found in response');
          setToken(null);
          return;
        }

        console.log('Successfully retrieved Mapbox token');
        setToken(data.token);
      } catch (error) {
        console.error('Error in fetchToken:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
};