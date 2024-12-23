import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";

export const useMapboxToken = () => {
  return localStorage.getItem("mapbox_token");
};

export const MapboxConfig = () => {
  const [token, setToken] = useState(localStorage.getItem("mapbox_token") || "");
  const { toast } = useToast();

  const handleSaveToken = () => {
    if (!token) {
      toast({
        title: "Error",
        description: "Please enter a Mapbox token",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("mapbox_token", token);
    toast({
      title: "Success",
      description: "Mapbox token saved successfully",
    });
    window.location.reload();
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
          />
          <Button onClick={handleSaveToken}>Save Token</Button>
        </div>
      </div>
    </div>
  );
};