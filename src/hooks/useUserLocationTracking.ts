import { useState, useEffect } from "react";
import { toast } from "@/utils/toast-utils";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export const useUserLocationTracking = () => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by this browser";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsTracking(true);
    setError(null);

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache for 1 minute
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(locationData);
        setError(null);
      },
      (error) => {
        let errorMessage = "Failed to get location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setIsTracking(false);
      },
      options
    );

    // Cleanup function
    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  };

  const stopTracking = () => {
    setIsTracking(false);
    setUserLocation(null);
    setError(null);
  };

  // Get current location once (not continuous tracking)
  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      // Fallback for localhost development without HTTPS or GPS
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('Using mock location for localhost development');
        const mockLocation: LocationData = {
          latitude: -24.65451, // Gaborone default
          longitude: 25.90859,
          accuracy: 10
        };
        resolve(mockLocation);
        return;
      }

      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          resolve(locationData);
        },
        (error) => {
          let errorMessage = "Failed to get location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  return {
    userLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
};