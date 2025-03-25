
import { getMapboxToken } from './index';

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;

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
      return token;
    } catch (error) {
      console.error('Error getting Mapbox token:', error);
      throw error;
    }
  }

  clearToken(): void {
    this.token = null;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
