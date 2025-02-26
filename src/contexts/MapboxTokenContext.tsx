
import { createContext, useContext, useState, useEffect } from 'react';
import { mapboxTokenManager } from '@/utils/mapboxTokenManager';
import { toast } from 'sonner';

interface MapboxTokenContextType {
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const MapboxTokenContext = createContext<MapboxTokenContextType>({
  token: null,
  isLoading: true,
  error: null
});

export const useMapboxToken = () => useContext(MapboxTokenContext);

export const MapboxTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = async () => {
      try {
        console.log('[MapboxTokenProvider] Initializing token...');
        const newToken = await mapboxTokenManager.getToken();
        if (newToken) {
          console.log('[MapboxTokenProvider] Token initialized successfully');
          setToken(newToken);
        } else {
          console.log('[MapboxTokenProvider] No token available');
          setError('No Mapbox token available');
        }
      } catch (err) {
        console.error('[MapboxTokenProvider] Error initializing token:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Mapbox token');
        toast.error('Failed to initialize map configuration');
      } finally {
        setIsLoading(false);
      }
    };

    initializeToken();
  }, []);

  return (
    <MapboxTokenContext.Provider value={{ token, isLoading, error }}>
      {children}
    </MapboxTokenContext.Provider>
  );
};
