import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log('Starting Mapbox token fetch...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error fetching token:', error);
          setError(error.message);
          toast.error("Failed to load map configuration");
          return;
        }

        if (!data?.token) {
          console.log('No token found in response:', data);
          setError("No Mapbox token found");
          toast.error("Map configuration is missing");
          return;
        }

        console.log('Successfully retrieved Mapbox token');
        setToken(data.token);
      } catch (error) {
        console.error('Error in fetchToken:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token';
        setError(errorMessage);
        toast.error("Failed to load map configuration");
      } finally {
        console.log('Token fetch completed');
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
};