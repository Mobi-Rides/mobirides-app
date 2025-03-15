
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const useLocationPermission = () => {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (!navigator.permissions) {
          console.log("Permissions API not supported");
          return;
        }
        
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionState(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionState(permission.state);
          
          if (permission.state === 'denied') {
            toast.error("Location permission was denied. Please enable location services.");
          }
        });
        
        return () => {
          permission.removeEventListener('change', () => {});
        };
      } catch (error) {
        console.error("Error checking location permission:", error);
      }
    };

    checkPermission();
  }, []);

  return permissionState;
};

export const PermissionStatus = ({ errorMessage }: { errorMessage: string | null }) => {
  if (!errorMessage) return null;
  
  return <span className="ml-2 text-xs text-red-500">{errorMessage}</span>;
};
