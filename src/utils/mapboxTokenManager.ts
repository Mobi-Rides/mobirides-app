import { supabase } from "@/integrations/supabase/client";

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;

  private constructor() {
    console.log('MapboxTokenManager initialized');
  }

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
      console.log('Token fetch completed:', this.token ? 'success' : 'no token');
      return this.token;
    } catch (error) {
      console.error('Error in getToken:', error);
      throw error;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchToken(): Promise<string | null> {
    try {
      // First try to get token from localStorage
      const localToken = localStorage.getItem('mapbox_token');
      if (localToken) {
        console.log('Using token from localStorage');
        return localToken;
      }

      // If no local token, try Supabase
      console.log('Trying to fetch token from Supabase...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('Error from Supabase function:', error);
        throw new Error(`Failed to fetch Mapbox token: ${error.message}`);
      }
      
      if (!data?.token) {
        console.error('No token in response:', data);
        throw new Error('No Mapbox token found in response');
      }
      
      console.log('Successfully retrieved Mapbox token from Supabase');
      return data.token;
    } catch (error) {
      console.error('Error in fetchToken:', error);
      throw error;
    }
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    this.token = null;
    this.tokenPromise = null;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();