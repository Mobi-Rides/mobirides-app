import { getMapboxToken } from "@/utils/mapbox";
import { toast } from "@/utils/toast-utils";
import * as turf from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';
import { offlineNavigationService } from "./offlineNavigationService";
import { navigationAnalytics } from "@/utils/navigationAnalytics";

export interface NavigationRoute {
  geometry: GeoJSON.Geometry; // GeoJSON geometry
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
  geometry: GeoJSON.Geometry;
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
  waypoints?: Array<{
    latitude: number;
    longitude: number;
  }>;
  profile?: 'driving' | 'walking' | 'cycling';
}

export class NavigationService {
  private static instance: NavigationService;
  private mapboxToken: string | null = null;
  
  // Active navigation state
  private activeRoute: NavigationRoute | null = null;
  private currentStepIndex: number = 0;
  private trackingWatchId: number | null = null;
  private subscribers: ((state: any) => void)[] = [];
  private destination: { latitude: number; longitude: number } | null = null;
  private lastOffRouteCheck: number = 0;
  private showTraffic: boolean = false;
  private currentSessionId: string | null = null;
  
  // Voice guidance state
  private voiceEnabled: boolean = false;
  private lastAnnouncedDistance: number = Infinity;
  private lastAnnouncedStepIndex: number = -1;

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
    // Check offline cache first if offline
    if (!navigator.onLine) {
      const cachedRoute = await offlineNavigationService.getOfflineRoute(request);
      if (cachedRoute) {
        toast.info("Using offline route");
        return cachedRoute;
      }
      toast.error("You are offline and no cached route found");
      return null;
    }

    if (!this.mapboxToken) {
      await this.initialize();
      if (!this.mapboxToken) {
        throw new Error("Navigation service not initialized");
      }
    }

    const { origin, destination, waypoints = [], profile = 'driving' } = request;

    try {
      // Build coordinates string: origin;waypoint1;waypoint2;...;destination
      const coordinates = [
        `${origin.longitude},${origin.latitude}`,
        ...waypoints.map(wp => `${wp.longitude},${wp.latitude}`),
        `${destination.longitude},${destination.latitude}`
      ].join(';');

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?steps=true&geometries=geojson&overview=full&access_token=${this.mapboxToken}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get route');
      }

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No route found");
      }

      const route = data.routes[0];
      
      const navigationRoute: NavigationRoute = {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        steps: route.legs.flatMap((leg: any) => leg.steps.map((step: {
          maneuver: { instruction: string; type: string };
          distance: number;
          duration: number;
          name: string;
          geometry: GeoJSON.Geometry;
        }) => ({
          instruction: step.maneuver.instruction,
          distance: step.distance,
          duration: step.duration,
          maneuver: step.maneuver.type,
          road_name: step.name,
          geometry: step.geometry
        })))
      };

      // Cache route for future offline use
      await offlineNavigationService.saveRoute(request, navigationRoute);

      return navigationRoute;
    } catch (error) {
      console.error("Error fetching route:", error);
      
      // Try fallback to cache on error even if online (maybe API error)
      const cachedRoute = await offlineNavigationService.getOfflineRoute(request);
      if (cachedRoute) {
        toast.info("Network error, using offline route");
        return cachedRoute;
      }

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

  async shareETA(destination: string, eta: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Trip ETA',
          text: `I'm on my way to ${destination}. ETA: ${eta}`,
          url: window.location.origin // Link to app
        });
        return true;
      } catch (err) {
        console.error('Error sharing:', err);
        return false;
      }
    }
    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`I'm on my way to ${destination}. ETA: ${eta}`);
      toast.success("ETA copied to clipboard");
      return true;
    } catch (err) {
      toast.error("Failed to share ETA");
      return false;
    }
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

  // Active Navigation Methods

  subscribe(callback: (state: any) => void) {
    this.subscribers.push(callback);
    // Immediately call with current state
    callback({
      activeRoute: this.activeRoute,
      currentStepIndex: this.currentStepIndex,
      isNavigating: !!this.activeRoute,
      showTraffic: this.showTraffic
    });
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers() {
    const state = {
      activeRoute: this.activeRoute,
      currentStepIndex: this.currentStepIndex,
      isNavigating: !!this.activeRoute,
      showTraffic: this.showTraffic
    };
    this.subscribers.forEach((cb) => cb(state));
  }

  toggleTraffic(): boolean {
    this.showTraffic = !this.showTraffic;
    this.notifySubscribers();
    return this.showTraffic;
  }

  startActiveNavigation(
    route: NavigationRoute, 
    destination: { latitude: number; longitude: number },
    onStepChange: (step: number) => void,
    onRouteUpdated?: (newRoute: NavigationRoute) => void
  ): void {
    this.activeRoute = route;
    this.destination = destination;
    this.currentStepIndex = 0;
    this.lastAnnouncedDistance = Infinity;
    this.lastAnnouncedStepIndex = -1;
    
    // Start analytics session
    if (route.steps.length > 0) {
      // We don't have user ID here easily without auth service, but we can pass 'current-user' or similar
      // In a real app we'd get this from auth context/service
      
      // Safe access to coordinates
      let startLat = 0;
      let startLng = 0;
      
      const geometry = route.geometry as any;
      if (geometry.coordinates && geometry.coordinates.length > 0) {
        startLng = geometry.coordinates[0][0];
        startLat = geometry.coordinates[0][1];
      }

      this.currentSessionId = navigationAnalytics.startSession(
        'current-user', 
        { lat: startLat, lng: startLng }, // origin from route geometry start
        destination as any,
        route
      );
    }

    this.notifySubscribers();

    if (this.trackingWatchId !== null) {
      navigator.geolocation.clearWatch(this.trackingWatchId);
    }

    this.trackingWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const userLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        this.updateNavigationProgress(userLoc, onStepChange, onRouteUpdated);
      },
      (error) => console.error("Tracking error:", error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  private updateNavigationProgress(
    userLocation: { latitude: number; longitude: number },
    onStepChange: (step: number) => void,
    onRouteUpdated?: (newRoute: NavigationRoute) => void
  ): void {
    if (!this.activeRoute) return;

    // Check if off-route every 10 seconds
    if (Date.now() - this.lastOffRouteCheck > 10000 && this.destination) {
      this.lastOffRouteCheck = Date.now();
      
      if (this.isOffRoute(userLocation, this.activeRoute)) {
        this.handleOffRoute(userLocation, this.destination).then((newRoute) => {
          if (newRoute && onRouteUpdated) {
            onRouteUpdated(newRoute);
            // Also notify subscribers as activeRoute changed
            this.notifySubscribers();
          }
        });
        return; // Skip step progression during reroute
      }
    }

    const currentStep = this.activeRoute.steps[this.currentStepIndex];
    const nextStep = this.activeRoute.steps[this.currentStepIndex + 1];

    if (nextStep) {
      // Check distance to end of current step (which is start of next step maneuver)
      const geometry = currentStep.geometry as any;
      if (geometry.type === 'LineString' && geometry.coordinates && geometry.coordinates.length > 0) {
        const endPoint = geometry.coordinates[geometry.coordinates.length - 1];
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          endPoint[1],
          endPoint[0]
        );

        // Progress to next step if within 30m
        if (distance < 30) {
          this.currentStepIndex++;
          onStepChange(this.currentStepIndex);
          this.notifySubscribers();
          this.announceManeuver(nextStep, distance);
        }
      }
    }
  }

  private isOffRoute(
    userLocation: { latitude: number; longitude: number },
    route: NavigationRoute
  ): boolean {
    // Get current route segment (from current step)
    const currentStep = route.steps[this.currentStepIndex];
    if (!currentStep) return false;

    const stepGeometry = currentStep.geometry;
    
    // Calculate perpendicular distance to route line
    const distanceToRoute = this.calculateDistanceToLine(
      userLocation,
      stepGeometry
    );
    
    // Off-route if more than 50m from route
    return distanceToRoute > 50;
  }
  
  private calculateDistanceToLine(
    point: { latitude: number; longitude: number },
    lineGeometry: GeoJSON.Geometry
  ): number {
    try {
      // Use turf.js for point-to-line distance calculation
      const turfPoint = turf.point([point.longitude, point.latitude]);
      
      // Handle different geometry types
      let turfLine;
      if (lineGeometry.type === 'LineString') {
        turfLine = turf.lineString((lineGeometry as any).coordinates);
      } else {
        // Fallback for non-linestring (shouldn't happen for steps)
        return 0;
      }
      
      // Calculate distance in meters ('kilometers' * 1000)
      const dist = pointToLineDistance(turfPoint, turfLine, { units: 'kilometers' });
      return dist * 1000;
    } catch (e) {
      console.warn('Error calculating distance to line:', e);
      return 0;
    }
  }
  
  async handleOffRoute(
    userLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<NavigationRoute | null> {
    toast.info("Recalculating route...");
    
    if (this.currentSessionId) {
      navigationAnalytics.logReroute(this.currentSessionId, userLocation as any);
    }
    
    // Fetch new route from current position to destination
    const newRoute = await this.getRoute({
      origin: userLocation,
      destination: destination,
      profile: 'driving'
    });
    
    if (newRoute) {
      this.activeRoute = newRoute;
      this.currentStepIndex = 0;
      toast.success("Route updated");
    } else {
      toast.error("Unable to recalculate route");
    }
    
    return newRoute;
  }

  stopActiveNavigation(): void {
    if (this.trackingWatchId !== null) {
      navigator.geolocation.clearWatch(this.trackingWatchId);
      this.trackingWatchId = null;
    }
    this.activeRoute = null;
    this.currentStepIndex = 0;
    
    if (this.currentSessionId) {
      navigationAnalytics.endSession(this.currentSessionId);
      this.currentSessionId = null;
    }
    
    // Stop any ongoing speech
    if (this.voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    this.notifySubscribers();
  }

  enableVoice(enabled: boolean): void {
    this.voiceEnabled = enabled;
    
    if (enabled && !('speechSynthesis' in window)) {
      toast.error("Voice guidance not supported on this device");
      this.voiceEnabled = false;
    } else if (enabled) {
      // Test announcement
      const utterance = new SpeechSynthesisUtterance("Voice guidance enabled");
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }
  }

  private announceManeuver(step: NavigationStep, distance: number): void {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Reset last announced distance if we moved to a new step
    if (this.currentStepIndex !== this.lastAnnouncedStepIndex) {
      this.lastAnnouncedStepIndex = this.currentStepIndex;
      this.lastAnnouncedDistance = Infinity;
    }
    
    // Announce at 500m, 200m, and 50m before maneuver
    const announceDistances = [500, 200, 50];
    
    // Find if we crossed any threshold we haven't announced yet
    const shouldAnnounce = announceDistances.some(d => 
      distance <= d && this.lastAnnouncedDistance > d
    );
    
    if (shouldAnnounce) {
      this.lastAnnouncedDistance = distance;
      
      const announcement = this.buildAnnouncement(step, distance);
      const utterance = new SpeechSynthesisUtterance(announcement);
      
      // Configure voice settings
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      // Cancel any ongoing speech to prioritize navigation
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }
  
  private buildAnnouncement(step: NavigationStep, distance: number): string {
    const distanceText = distance < 100 
      ? `In ${Math.round(distance)} meters` 
      : `In ${Math.round(distance / 100) * 100} meters`;
    
    // Clean up instruction (sometimes API gives "Head north on Road", we want "Turn right onto Road")
    // Use maneuver type + road name if instruction is too verbose or just use instruction
    return `${distanceText}, ${step.instruction}`;
  }
}

export const navigationService = NavigationService.getInstance();
