
import { useState } from "react";
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

  const handleSaveToken = async () => {
    if (!token) {
      toast.error("Please enter a Mapbox token");
      return;
    }

    if (!token.startsWith('pk.')) {
      toast.error("Invalid Mapbox token format. Public tokens should start with 'pk.'");
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing token first
      mapboxTokenManager.clearToken();
      
      // Store in localStorage
      localStorage.setItem('mapbox_token', token);
      console.log('Token saved to localStorage');
      
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
      
      // Instead of reloading, trigger a re-render through state
      mapboxTokenManager.setToken(token);
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
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter your Mapbox token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleSaveToken} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Token"}
          </Button>
        </div>
      </div>
    </div>
  );
};
