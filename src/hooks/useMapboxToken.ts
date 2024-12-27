import { useState, useEffect } from "react";
import { mapboxTokenManager } from "@/utils/mapboxTokenManager";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await mapboxTokenManager.getToken();
        setToken(token);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch token");
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
};