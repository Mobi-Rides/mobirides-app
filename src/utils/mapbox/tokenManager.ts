
import { getMapboxToken } from './index';

// Define proper types for Mapbox GL
interface MapboxGL {
  accessToken: string;
  // Add other known Mapbox GL properties as needed
  version?: string;
  supported?: boolean;
  workerClass?: unknown;
  workerUrl?: string;
  [key: string]: unknown; // Allow other Mapbox GL properties with unknown type
}

// Extend the Window interface to include mapboxgl
declare global {
  interface Window {
    mapboxgl?: MapboxGL;
  }
}

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenValid: boolean = false;
  private tokenPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  async getToken(): Promise<string> {
    // Return cached token if available
    if (this.token) {
      return this.token;
    }

    // If there's already a pending token request, return that promise
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    try {
      // Create a new token promise
      this.tokenPromise = getMapboxToken();
      
      // Await the token and store it
      const token = await this.tokenPromise;
      
      if (!token) {
        throw new Error('No Mapbox token available');
      }
      
      // Store the token and set validity
      this.token = token;
      this.tokenValid = true;
      
      // Clear the promise now that it's resolved
      this.tokenPromise = null;
      
      // Return the token
      return token;
    } catch (error) {
      // Clear the promise on error
      this.tokenPromise = null;
      console.error('Error getting Mapbox token:', error);
      throw error;
    }
  }

  getTokenState() {
    return {
      token: this.token,
      valid: this.tokenValid
    };
  }

  async validateAndSetToken(token: string): Promise<boolean> {
    try {
      if (!token || token.trim().length === 0) {
        return false;
      }
      
      // Store token and mark as valid
      this.token = token;
      this.tokenValid = true;
      
      // Set token on the global mapboxgl object if available
      if (window.mapboxgl) {
        window.mapboxgl.accessToken = token;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  getInstanceManager() {
    // This is a placeholder - in a real implementation you would return
    // whatever instance manager is required
    return {
      isReady: () => true,
      getMapboxModule: async () => {
        // Implementation for returning the mapbox module
        return {};
      }
    };
  }

  clearToken(): void {
    this.token = null;
    this.tokenValid = false;
    this.tokenPromise = null;
    
    // Clear token from global mapboxgl object if available
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = '';
    }
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
