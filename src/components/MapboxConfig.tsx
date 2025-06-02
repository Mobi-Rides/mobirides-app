
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { mapboxTokenManager } from "@/utils/mapbox";
import { toast } from "sonner";

const MapboxConfig = () => {
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const tokenState = mapboxTokenManager.getTokenState();
  const hasToken = !!tokenState.token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!token.trim()) {
      setError("Please enter a Mapbox token");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const isValid = await mapboxTokenManager.validateAndSetToken(token);
      
      if (isValid) {
        toast.success("Mapbox token set successfully");
        window.location.reload(); // Reload to initialize map with new token
      } else {
        setError("Invalid token format");
      }
    } catch (error) {
      console.error("Error setting token:", error);
      setError("Failed to set token. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-md mx-auto">
      <div className="flex flex-col space-y-4">
        <h2 className="text-lg font-semibold">Map Configuration Required</h2>
        
        {!hasToken && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Mapbox Token Found</AlertTitle>
            <AlertDescription>
              This feature requires a Mapbox token to function.
            </AlertDescription>
          </Alert>
        )}
        
        {tokenState.token && !tokenState.valid && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Token</AlertTitle>
            <AlertDescription>
              Your Mapbox token is invalid or has expired.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-sm text-muted-foreground">
          Please enter your Mapbox public token below. You can find this in your Mapbox account dashboard.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter your Mapbox token here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Setting..." : "Set Token"}
            </Button>
          </div>
        </form>
        
        <div className="text-xs text-muted-foreground mt-2">
          <p>
            Need a token? <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Get one from Mapbox</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapboxConfig;
