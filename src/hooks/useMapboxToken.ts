import { useState, useEffect } from "react";
import { getMapboxToken } from "@/utils/mapbox";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const fetchedToken = await getMapboxToken();
        setToken(fetchedToken);
      } catch (error) {
        console.error("Error fetching Mapbox token:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading };
};