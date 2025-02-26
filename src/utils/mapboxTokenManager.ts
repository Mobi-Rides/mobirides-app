
import { supabase } from "@/integrations/supabase/client";

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;
  private initializationAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;

  private constructor() {
    console.log('MapboxTokenManager initialized');
  }

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  setToken(token: string) {
    this.token = token;
    this.tokenPromise = null;
    this.initializationAttempts = 0;
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

    // Start new token fetch with retry logic
    console.log(`Fetching Mapbox token (attempt ${this.initializationAttempts + 1}/${this.MAX_ATTEMPTS})`);
    this.tokenPromise = this.fetchTokenWithRetry();
    
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

  private async fetchTokenWithRetry(): Promise<string | null> {
    while (this.initializationAttempts < this.MAX_ATTEMPTS) {
      try {
        // Always check localStorage first
        const localToken = localStorage.getItem('mapbox_token');
        if (localToken) {
          console.log('Using token from localStorage');
          return localToken;
        }

        // Try Supabase if localStorage is empty
        console.log('No token in localStorage, trying Supabase...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error from Supabase function:', error);
          throw error;
        }
        
        if (data?.token) {
          console.log('Successfully retrieved token from Supabase');
          localStorage.setItem('mapbox_token', data.token);
          return data.token;
        }

        throw new Error('No token available');
      } catch (error) {
        this.initializationAttempts++;
        if (this.initializationAttempts < this.MAX_ATTEMPTS) {
          console.log(`Retrying token fetch in ${this.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    
    console.error('Max token fetch attempts reached');
    return null;
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    this.token = null;
    this.tokenPromise = null;
    this.initializationAttempts = 0;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
