import { useState, useEffect } from "react";
import { getMapboxToken } from "@/utils/mapbox";

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("Fetching Mapbox token...");
        const fetchedToken = await getMapboxToken();
        console.log("Token fetch result:", fetchedToken ? "Success" : "No token found");
        setToken(fetchedToken);
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