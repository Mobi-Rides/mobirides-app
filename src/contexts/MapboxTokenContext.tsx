
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { getMapboxToken } from "../utils/mapbox";

interface MapboxTokenContextType {
  token: string | null;
  isValid: boolean;
  loading: boolean;
  refreshToken: () => Promise<void>;
}

const MapboxTokenContext = createContext<MapboxTokenContextType>({
  token: null,
  isValid: false,
  loading: true,
  refreshToken: async () => {},
});

export const useMapboxToken = () => useContext(MapboxTokenContext);

export const MapboxTokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokenState, setTokenState] = useState<
    Omit<MapboxTokenContextType, "refreshToken">
  >({
    token: null,
    isValid: false,
    loading: true,
  });

  const initializeToken = async () => {
    setTokenState((prev) => ({ ...prev, loading: true }));

    try {
      const token = await getMapboxToken();

      if (!token) {
        throw new Error("No token returned from token manager");
      }

      // Set the token in the mapboxgl instance
      if (window.mapboxgl) {
        window.mapboxgl.accessToken = token;
      }

      setTokenState({
        token,
        isValid: true,
        loading: false,
      });
    } catch (error) {
      console.error("[MapboxTokenProvider] Failed to initialize token", error);
      toast.error("Failed to initialize map. Please try again later.");
      setTokenState({
        token: null,
        isValid: false,
        loading: false,
      });
    }
  };

  const refreshToken = async () => {
    setTokenState((prev) => ({ ...prev, loading: true }));
    
    try {
      const token = await getMapboxToken();
      
      if (!token) {
        throw new Error("Failed to refresh Mapbox token");
      }

      // Update the global mapboxgl instance if available
      if (window.mapboxgl) {
        window.mapboxgl.accessToken = token;
      }

      setTokenState({
        token,
        isValid: true,
        loading: false,
      });
    } catch (error) {
      console.error("[MapboxTokenProvider] Failed to refresh token", error);
      toast.error("Failed to refresh map token. Please reload the page.");
      setTokenState({
        token: null,
        isValid: false,
        loading: false,
      });
    }
  };

  useEffect(() => {
    initializeToken();
  }, []);

  return (
    <MapboxTokenContext.Provider value={{ ...tokenState, refreshToken }}>
      {children}
    </MapboxTokenContext.Provider>
  );
};
