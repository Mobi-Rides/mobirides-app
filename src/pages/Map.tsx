import { useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { mapCore } from "@/utils/mapbox/core/MapCore";
import { locationManager } from "@/utils/mapbox/location/LocationManager";
import { resourceManager } from "@/utils/mapbox/core/resource/ResourceManager";
import { toast } from "sonner";
import { eventBus } from "@/utils/mapbox/core/eventBus";
import { MapStateEvent } from "@/utils/mapbox/core/types";
import { locationStateManager } from "@/utils/mapbox/location/LocationStateManager";
import { stateManager } from "@/utils/mapbox/core/stateManager";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "../utils/mapbox";

const Map = () => {
  const [mapToken, setMapToken] = useState<string>("");

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getMapboxToken();
      setMapToken(token);
    };
    fetchToken();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="h-[calc(100vh-4rem)]">
          {mapToken.length !== 0 ? (
            <CustomMapbox
              mapbox_token={mapToken}
              longitude={25.90859}
              latitude={-24.65451}
            />
          ) : (
            <div className="w-full h-full rounded-lg overflow-hidden" />
          )}
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default Map;
