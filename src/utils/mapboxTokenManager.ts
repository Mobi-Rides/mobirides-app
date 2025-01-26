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
      // Always check localStorage first
      const localToken = localStorage.getItem('mapbox_token');
      if (localToken) {
        console.log('Using token from localStorage');
        return localToken;
      }

      // Only try Supabase if localStorage is empty
      console.log('No token in localStorage, trying Supabase...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      
      if (error) {
        console.error('Error from Supabase function:', error);
        return null;
      }
      
      if (!data?.token) {
        console.log('No token in Supabase response');
        return null;
      }
      
      console.log('Successfully retrieved token from Supabase');
      // Save to localStorage for future use
      localStorage.setItem('mapbox_token', data.token);
      return data.token;
    } catch (error) {
      console.error('Error in fetchToken:', error);
      return null;
    }
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    this.token = null;
    this.tokenPromise = null;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();