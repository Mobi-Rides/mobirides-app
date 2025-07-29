import { getMapboxToken } from "@/utils/mapbox";
import { toast } from "@/utils/toast-utils";

export interface NavigationRoute {
  geometry: any; // GeoJSON geometry
  distance: number;
  duration: number;
  steps: NavigationStep[];
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  duration: number;
  maneuver: string;
  road_name?: string;
  geometry: any;
}

export interface RouteRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  profile?: 'driving' | 'walking' | 'cycling';
}

export class NavigationService {
  private static instance: NavigationService;
  private mapboxToken: string | null = null;

  private constructor() {}

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      this.mapboxToken = await getMapboxToken();
      return !!this.mapboxToken;
    } catch (error) {
      console.error("Failed to initialize navigation service:", error);
      toast.error("Navigation service unavailable");
      return false;
    }
  }

  async getRoute(request: RouteRequest): Promise<NavigationRoute | null> {
    if (!this.mapboxToken) {
      await this.initialize();
      if (!this.mapboxToken) {
        throw new Error("Navigation service not initialized");
      }
    }

    const { origin, destination, profile = 'driving' } = request;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?steps=true&geometries=geojson&overview=full&access_token=${this.mapboxToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get route');
      }

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      
      return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        steps: route.legs[0].steps.map((step: any) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          maneuver: step.maneuver.type,
          road_name: step.name,
          geometry: step.geometry
        }))
      };
    } catch (error) {
      console.error("Error fetching route:", error);
      toast.error("Unable to calculate route");
      return null;
    }
  }

  async getDirections(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<NavigationStep[]> {
    const route = await this.getRoute({ origin, destination });
    return route?.steps || [];
  }

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    if (minutes < 1) {
      return "< 1 min";
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export const navigationService = NavigationService.getInstance();