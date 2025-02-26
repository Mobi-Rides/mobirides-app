
import { supabase } from "@/integrations/supabase/client";

interface TokenState {
  status: 'uninitialized' | 'loading' | 'valid' | 'error';
  token: string | null;
  error?: string;
  lastValidated: number;
}

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private tokenState: TokenState = {
    status: 'uninitialized',
    token: null,
    lastValidated: 0
  };
  private tokenPromise: Promise<string | null> | null = null;
  private initializationAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly TOKEN_VALIDATION_INTERVAL = 1800000; // 30 minutes
  private readonly TOKEN_FORMAT_REGEX = /^pk\./;

  private constructor() {
    console.log('MapboxTokenManager initialized');
  }

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  private validateToken(token: string): boolean {
    if (!token) return false;
    if (!this.TOKEN_FORMAT_REGEX.test(token)) return false;
    if (token.length < 50 || token.length > 500) return false;
    return true;
  }

  private encryptToken(token: string): string {
    // Simple encryption for localStorage - in a real app, use a proper encryption library
    return btoa(token);
  }

  private decryptToken(encryptedToken: string): string {
    // Simple decryption for localStorage - in a real app, use a proper encryption library
    return atob(encryptedToken);
  }

  private isTokenStale(): boolean {
    return Date.now() - this.tokenState.lastValidated > this.TOKEN_VALIDATION_INTERVAL;
  }

  setToken(token: string) {
    if (!this.validateToken(token)) {
      console.error('Invalid token format');
      this.tokenState = {
        status: 'error',
        token: null,
        error: 'Invalid token format',
        lastValidated: Date.now()
      };
      return;
    }

    const encryptedToken = this.encryptToken(token);
    localStorage.setItem('mapbox_token', encryptedToken);
    
    this.tokenState = {
      status: 'valid',
      token,
      lastValidated: Date.now()
    };
    
    this.tokenPromise = null;
    this.initializationAttempts = 0;
    
    console.log('Token successfully set and encrypted');
  }

  async getToken(): Promise<string | null> {
    // Return cached valid token if not stale
    if (this.tokenState.token && !this.isTokenStale()) {
      console.log('Using cached Mapbox token');
      return this.tokenState.token;
    }

    // If there's an ongoing token fetch, return its promise
    if (this.tokenPromise) {
      console.log('Using existing token fetch promise');
      return this.tokenPromise;
    }

    // Start new token fetch with retry logic
    console.log(`Fetching Mapbox token (attempt ${this.initializationAttempts + 1}/${this.MAX_ATTEMPTS})`);
    this.tokenState.status = 'loading';
    this.tokenPromise = this.fetchTokenWithRetry();
    
    try {
      const token = await this.tokenPromise;
      this.tokenState = {
        status: token ? 'valid' : 'error',
        token,
        error: token ? undefined : 'Failed to fetch token',
        lastValidated: Date.now()
      };
      return token;
    } catch (error) {
      console.error('Error in getToken:', error);
      this.tokenState = {
        status: 'error',
        token: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastValidated: Date.now()
      };
      throw error;
    } finally {
      this.tokenPromise = null;
    }
  }

  private async fetchTokenWithRetry(): Promise<string | null> {
    while (this.initializationAttempts < this.MAX_ATTEMPTS) {
      try {
        // Check localStorage first
        const encryptedToken = localStorage.getItem('mapbox_token');
        if (encryptedToken) {
          const token = this.decryptToken(encryptedToken);
          if (this.validateToken(token)) {
            console.log('Using validated token from localStorage');
            return token;
          } else {
            console.log('Invalid token in localStorage, removing');
            localStorage.removeItem('mapbox_token');
          }
        }

        // Try Supabase if localStorage is empty or invalid
        console.log('No valid token in localStorage, trying Supabase...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Error from Supabase function:', error);
          throw error;
        }
        
        if (data?.token && this.validateToken(data.token)) {
          console.log('Successfully retrieved and validated token from Supabase');
          const encryptedToken = this.encryptToken(data.token);
          localStorage.setItem('mapbox_token', encryptedToken);
          return data.token;
        }

        throw new Error('No valid token available');
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

  getTokenState(): TokenState {
    return { ...this.tokenState };
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    localStorage.removeItem('mapbox_token');
    this.tokenState = {
      status: 'uninitialized',
      token: null,
      lastValidated: 0
    };
    this.tokenPromise = null;
    this.initializationAttempts = 0;
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
