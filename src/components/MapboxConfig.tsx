
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mapboxTokenManager } from "@/utils/mapboxTokenManager";
import { Alert, AlertDescription } from "./ui/alert";

export const getMapboxToken = async () => {
  try {
    console.log('Attempting to get token from local storage...');
    const token = await mapboxTokenManager.getToken();
    if (token) {
      console.log('Found valid token in local storage');
      
      // Attempt Supabase backup in background without blocking
      try {
        console.log('Attempting background Supabase backup...');
        supabase.functions.invoke('set-mapbox-token', {
          body: { token }
        }).then(() => {
          console.log('Background Supabase backup successful');
        }).catch((error) => {
          console.warn('Background Supabase backup failed:', error);
        });
      } catch (e) {
        console.warn('Background Supabase backup attempt failed:', e);
      }
      
      return token;
    }

    console.log('No valid token in local storage, fetching from Supabase...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.warn('Error fetching token from Supabase:', error);
      return null;
    }

    if (!data?.token) {
      console.log('No token found in Supabase');
      return null;
    }

    console.log('Got token from Supabase, validating and storing...');
    const validationResult = mapboxTokenManager.validateToken(data.token);
    if (!validationResult.isValid) {
      console.error('Token validation failed:', validationResult.error);
      return null;
    }

    mapboxTokenManager.setToken(data.token);
    return data.token;
  } catch (error) {
    console.error('Error in getMapboxToken:', error);
    return null;
  }
};

interface MapboxConfigProps {
  onTokenSaved?: () => void;
}

export const MapboxConfig = ({ onTokenSaved }: MapboxConfigProps) => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState(mapboxTokenManager.getTokenState());

  useEffect(() => {
    const checkExistingToken = async () => {
      setIsLoading(true);
      setValidationError(null);
      
      try {
        const token = await getMapboxToken();
        if (token) {
          setTokenState(mapboxTokenManager.getTokenState());
          onTokenSaved?.();
        }
      } catch (error) {
        console.error('Error checking existing token:', error);
        setValidationError("Failed to validate existing token");
        toast.error("Failed to validate existing token");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkExistingToken();
  }, [onTokenSaved]);

  const validateInputToken = (token: string) => {
    if (!token) {
      return { isValid: false, error: "Please enter a Mapbox token" };
    }
    if (!token.startsWith('pk.')) {
      return { isValid: false, error: "Token must start with 'pk.'" };
    }
    if (token.length < 50) {
      return { isValid: false, error: "Token is too short" };
    }
    if (token.length > 500) {
      return { isValid: false, error: "Token is too long" };
    }
    return { isValid: true };
  };

  const handleSaveToken = async () => {
    setValidationError(null);
    const validation = validateInputToken(token);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      toast.error(validation.error);
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing token first
      mapboxTokenManager.clearToken();
      
      // Set new token (this will validate and encrypt it)
      mapboxTokenManager.setToken(token);
      
      // Get updated state
      const newState = mapboxTokenManager.getTokenState();
      setTokenState(newState);
      
      if (newState.status === 'error') {
        setValidationError(newState.error || "Invalid token format");
        toast.error(newState.error || "Invalid token format");
        return;
      }
      
      // Attempt to save to Supabase as backup (non-blocking)
      try {
        console.log('Attempting Supabase backup...');
        const { error } = await supabase.functions.invoke('set-mapbox-token', {
          body: { token }
        });

        if (error) {
          console.warn("Supabase backup storage failed:", error);
          // Don't block on Supabase failure
        } else {
          console.log('Token backup saved to Supabase');
        }
      } catch (e) {
        console.warn("Supabase backup attempt failed:", e);
        // Continue even if Supabase backup fails
      }

      toast.success("Mapbox token saved successfully");
      onTokenSaved?.();
    } catch (error) {
      console.error("Error saving token:", error);
      setValidationError("Failed to save token. Please try again.");
      toast.error("Failed to save token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p>Validating Mapbox configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Mapbox Configuration Required</h2>
          <p className="text-sm text-muted-foreground">
            Please enter your Mapbox public token to enable map functionality.
            You can find your token at{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mapbox Access Tokens
            </a>
          </p>
          
          {validationError && (
            <Alert variant="destructive">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Your token must:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Start with 'pk.'</li>
              <li>Be a public access token</li>
              <li>Be between 50 and 500 characters</li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your Mapbox token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1"
            disabled={isLoading || tokenState.status === 'loading'}
          />
          <Button 
            onClick={handleSaveToken} 
            disabled={isLoading || tokenState.status === 'loading'}
          >
            {isLoading ? "Saving..." : "Save Token"}
          </Button>
        </div>
      </div>
    </div>
  );
};
