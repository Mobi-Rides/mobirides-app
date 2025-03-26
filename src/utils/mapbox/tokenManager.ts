
import { getMapboxToken } from './index';

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenValid: boolean = false;

  private constructor() {}

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    try {
      const token = await getMapboxToken();
      if (!token) {
        throw new Error('No Mapbox token available');
      }
      this.token = token;
      this.tokenValid = true;
      return token;
    } catch (error) {
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
      // Add validation logic if needed
      this.token = token;
      this.tokenValid = true;
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
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
