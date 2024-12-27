import { useRef, useState } from "react";
import { SearchFilters, type SearchFilters as FilterType } from "@/components/SearchFilters";
import { VehicleMarker } from "@/components/VehicleMarker";
import { Navigation } from "@/components/Navigation";
import { useMap } from "@/hooks/useMap";
import { Button } from "@/components/ui/button";
import { Locate } from "lucide-react";
import { toast } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";

const MapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const { 
    isLoading, 
    error, 
    refreshLocation,
    isConfigured
  } = useMap({ 
    container: mapContainer,
    initialView: {
      latitude: -24.6282,
      longitude: 25.9231,
      zoom: 12
    }
  });

  const handleFiltersChange = (newFilters: FilterType) => {
    console.log("Filters updated:", newFilters);
  };

  const handleGeolocate = () => {
    console.log("Manual location refresh requested");
    refreshLocation(true);
    toast.info("Updating your location...");
  };

  if (!isConfigured) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Mapbox Configuration Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please configure your Mapbox token in the Supabase Edge Function settings.
          </p>
          <a 
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Get your Mapbox token
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-destructive">Error loading map: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchFilters onFiltersChange={handleFiltersChange} />
      </div>
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      />
      <Button
        onClick={handleGeolocate}
        className="absolute bottom-24 right-4 z-10"
        size="icon"
        variant="secondary"
      >
        <Locate className="h-4 w-4" />
      </Button>
      <Navigation />
    </div>
  );
};

export default MapPage;