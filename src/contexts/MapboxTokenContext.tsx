import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { mapboxTokenManager } from "@/utils/mapbox/tokenManager";
import { toast } from "sonner";
import { getMapboxToken } from "../utils/mapbox";

interface MapboxTokenContextType {
  token: string | null;
  isValid: boolean;
  loading: boolean;
  refreshToken: () => Promise<void>;
}
const mapBoxToken = await getMapboxToken();

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
    console.info("[MapboxTokenProvider] Initializing token...");
    setTokenState((prev) => ({ ...prev, loading: true }));

    try {
      const token = await mapBoxToken;
      console.info("[MapboxTokenProvider] Token initialized successfully");

      if (!token) {
        throw new Error("No token returned from token manager");
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
    console.info("[MapboxTokenProvider] Refreshing token...");
    mapboxTokenManager.clearToken();
    await initializeToken();
  };

  useEffect(() => {
    console.info("[MapboxTokenProvider] Initializing token...");
    initializeToken();
  }, []);

  return (
    <MapboxTokenContext.Provider value={{ ...tokenState, refreshToken }}>
      {children}
    </MapboxTokenContext.Provider>
  );
};
