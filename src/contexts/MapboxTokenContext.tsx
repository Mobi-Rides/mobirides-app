
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { mapboxTokenManager } from "@/utils/mapbox/tokenManager";

interface MapboxTokenContextType {
  token: string | null;
  isValid: boolean;
  loading: boolean;
}

const MapboxTokenContext = createContext<MapboxTokenContextType>({
  token: null,
  isValid: false,
  loading: true,
});

export const useMapboxToken = () => useContext(MapboxTokenContext);

export const MapboxTokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokenState, setTokenState] = useState<MapboxTokenContextType>({
    token: null,
    isValid: false,
    loading: true,
  });

  useEffect(() => {
    console.info('[MapboxTokenProvider] Initializing token...');
    initializeToken();
  }, []);

  const initializeToken = async () => {
    try {
      const token = await mapboxTokenManager.getToken();
      console.info('[MapboxTokenProvider] Token initialized successfully');
      setTokenState({
        token,
        isValid: true,
        loading: false,
      });
    } catch (error) {
      console.error('[MapboxTokenProvider] Failed to initialize token', error);
      setTokenState({
        token: null,
        isValid: false,
        loading: false,
      });
    }
  };

  return (
    <MapboxTokenContext.Provider value={tokenState}>
      {children}
    </MapboxTokenContext.Provider>
  );
};
