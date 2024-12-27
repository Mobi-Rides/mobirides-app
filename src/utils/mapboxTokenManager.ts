import { supabase } from "@/integrations/supabase/client";

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;

  private constructor() {}

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  async getToken(): Promise<string | null> {
    // Return cached token if available
    if (this.token) {
      console.log('Using cached Mapbox token');
      return this.token;
    }

    // If there's an ongoing token fetch, return its promise
    if (this.tokenPromise) {
      console.log('Using existing token fetch promise');
      return this.tokenPromise;
    }

    // Start new token fetch
    console.log('Fetching new Mapbox token');
    this.tokenPromise = this.fetchToken();
    
    try {
      this.token = await this.tokenPromise;
      return this.token;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('Error fetching Mapbox token:', error);
        return null;
      }
      
      if (!data?.token) {
        console.warn('No Mapbox token found in response');
        return null;
      }
      
      console.log('Successfully retrieved Mapbox token');
      return data.token;
    } catch (error) {
      console.error('Error in token fetch:', error);
      return null;
    }
  }

  clearToken() {
    this.token = null;
    this.tokenPromise = null;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();