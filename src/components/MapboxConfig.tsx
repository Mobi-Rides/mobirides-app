
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mapboxTokenManager } from "@/utils/mapboxTokenManager";

export const getMapboxToken = async () => {
  return mapboxTokenManager.getToken();
};

export const MapboxConfig = () => {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tokenState, setTokenState] = useState(mapboxTokenManager.getTokenState());

  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        await mapboxTokenManager.getToken();
        setTokenState(mapboxTokenManager.getTokenState());
      } catch (error) {
        console.error('Error checking existing token:', error);
      }
    };
    
    checkExistingToken();
  }, []);

  const handleSaveToken = async () => {
    if (!token) {
      toast.error("Please enter a Mapbox token");
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
        toast.error(newState.error || "Invalid token format");
        return;
      }
      
      // Attempt to save to Supabase as backup
      try {
        console.log('Saving token to Supabase...');
        const { error } = await supabase.functions.invoke('set-mapbox-token', {
          body: { token }
        });

        if (error) {
          console.warn("Supabase backup storage failed:", error);
          // Continue since we have localStorage
        } else {
          console.log('Token backup saved to Supabase');
        }
      } catch (e) {
        console.warn("Supabase backup attempt failed:", e);
        // Continue since we have localStorage
      }

      toast.success("Mapbox token saved successfully");
    } catch (error) {
      console.error("Error saving token:", error);
      toast.error("Failed to save token. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          {tokenState.status === 'error' && (
            <p className="text-sm text-destructive">{tokenState.error}</p>
          )}
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
        {tokenState.status === 'loading' && (
          <p className="text-sm text-muted-foreground">
            Validating token...
          </p>
        )}
      </div>
    </div>
  );
};
