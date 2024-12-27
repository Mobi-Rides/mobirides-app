import { useEffect, useRef, useState, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { toast } from 'sonner';
import { getMapboxToken } from '@/utils/mapbox';

interface MapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface UseMapProps {
  container: MutableRefObject<HTMLDivElement | null>;
  initialView: MapView;
}

interface LocationState {
  accuracy: number | null;
  watchId: number | null;
  marker: mapboxgl.Marker | null;
}

export const useMap = ({ container, initialView }: UseMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationState = useRef<LocationState>({
    accuracy: null,
    watchId: null,
    marker: null
  });

  // Initialize map with Mapbox token
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const token = await getMapboxToken();
        if (!token) {
          setIsConfigured(false);
          setIsLoading(false);
          return;
        }

        setIsConfigured(true);
        if (!container.current) return;

        mapboxgl.accessToken = token;
        
        map.current = new mapboxgl.Map({
          container: container.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [initialView.longitude, initialView.latitude],
          zoom: initialView.zoom,
          pitchWithRotate: false,
          attributionControl: false
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add attribution control in bottom-left
        map.current.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setIsLoading(false);
          startLocationTracking();
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
        setIsLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      stopLocationTracking();
    };
  }, [container, initialView]);

  const createLocationMarker = (longitude: number, latitude: number, accuracy: number) => {
    if (!map.current) return null;

    // Remove existing marker
    if (locationState.current.marker) {
      locationState.current.marker.remove();
    }

    // Create marker element
    const el = document.createElement('div');
    el.className = 'relative';
    
    // Create dot
    const dot = document.createElement('div');
    dot.className = 'w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg';
    
    // Create accuracy circle
    const circle = document.createElement('div');
    const circleSize = Math.min(Math.max(accuracy / 5, 16), 100);
    circle.style.width = `${circleSize}px`;
    circle.style.height = `${circleSize}px`;
    circle.className = 'absolute rounded-full bg-primary/20 animate-pulse';
    circle.style.left = `${-circleSize/2 + 8}px`;
    circle.style.top = `${-circleSize/2 + 8}px`;
    
    el.appendChild(circle);
    el.appendChild(dot);

    // Create and return new marker
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div class="p-2">
              <p class="font-semibold">Your Location</p>
              <p class="text-sm text-muted-foreground">
                Accuracy: ${Math.round(accuracy)}m
              </p>
              ${accuracy > 50 ? 
                '<p class="text-xs text-orange-500">⚠️ Low accuracy. Try moving to an open area.</p>' : 
                '<p class="text-xs text-green-500">✓ Good accuracy</p>'
              }
            </div>
          `)
      )
      .addTo(map.current);

    return marker;
  };

  const handleLocationSuccess = (position: GeolocationPosition, center: boolean = false) => {
    if (!map.current) return;

    const { latitude, longitude, accuracy } = position.coords;
    console.log('Location update:', { latitude, longitude, accuracy });

    // Update marker
    const marker = createLocationMarker(longitude, latitude, accuracy);
    locationState.current = {
      ...locationState.current,
      accuracy,
      marker
    };

    // Center map if requested
    if (center) {
      map.current.easeTo({
        center: [longitude, latitude],
        zoom: 15,
        duration: 1000
      });
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    let message = 'Could not get your location. ';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message += 'Please enable location services in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message += 'Try moving to an area with better GPS signal.';
        break;
      case error.TIMEOUT:
        message += 'Location request timed out. Please try again.';
        break;
      default:
        message += error.message;
    }
    
    toast.error(message);
  };

  const startLocationTracking = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Clear existing watch
    stopLocationTracking();

    // Start watching position
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
    
    locationState.current.watchId = watchId;
    console.log('Started location tracking, watch ID:', watchId);
  };

  const stopLocationTracking = () => {
    if (locationState.current.watchId !== null) {
      navigator.geolocation.clearWatch(locationState.current.watchId);
      locationState.current.watchId = null;
    }
    if (locationState.current.marker) {
      locationState.current.marker.remove();
      locationState.current.marker = null;
    }
  };

  const refreshLocation = (center: boolean = false) => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => handleLocationSuccess(position, center),
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  };

  return {
    isLoading,
    error,
    isConfigured,
    refreshLocation
  };
};