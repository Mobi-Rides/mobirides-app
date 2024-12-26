import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useMapboxToken = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    if (error) {
      console.error('Error fetching Mapbox token:', error);
      return null;
    }
    return data.token;
  } catch (error) {
    console.error('Error invoking function:', error);
    return null;
  }
};

export const MapboxConfig = () => {
  const [token, setToken] = useState("");
  const { toast } = useToast();

  const handleSaveToken = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please enter a Mapbox token",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('set-mapbox-token', {
        body: { token }
      });

      if (error) {
        console.error("Error saving token:", error);
        toast({
          title: "Error",
          description: "Failed to save token. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Mapbox token saved successfully",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error saving token:", error);
      toast({
        title: "Error",
        description: "Failed to save token. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Mapbox Configuration Required</h2>
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
          />
          <Button onClick={handleSaveToken}>Save Token</Button>
        </div>
      </div>
    </div>
  );
};