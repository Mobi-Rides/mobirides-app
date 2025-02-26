
import { supabase } from "@/integrations/supabase/client";

interface TokenState {
  status: 'uninitialized' | 'valid' | 'error' | 'loading';
  token: string | null;
  lastValidated: number;
  error?: string;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private tokenState: TokenState = {
    status: 'uninitialized',
    token: null,
    lastValidated: 0
  };
  private readonly TOKEN_FORMAT_REGEX = /^pk\./;
  private readonly TOKEN_VALIDATION_INTERVAL = 1800000; // 30 minutes
  private isInitializing = false;

  private constructor() {
    console.log('MapboxTokenManager initialized');
    this.initializeFromEnvironment();
  }

  private async initializeFromEnvironment() {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken) {
      console.log('Found token in environment, validating...');
      await this.validateAndSetToken(envToken);
    }
  }

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  validateToken(token: string): ValidationResult {
    if (!token) return { isValid: false, error: 'Token is required' };
    if (!this.TOKEN_FORMAT_REGEX.test(token)) {
      return { isValid: false, error: "Token must start with 'pk.'" };
    }
    if (token.length < 50) {
      return { isValid: false, error: 'Token is too short' };
    }
    if (token.length > 500) {
      return { isValid: false, error: 'Token is too long' };
    }
    return { isValid: true };
  }

  private encryptToken(token: string): string {
    return btoa(token);
  }

  private decryptToken(encryptedToken: string): string {
    return atob(encryptedToken);
  }

  private isTokenStale(): boolean {
    return Date.now() - this.tokenState.lastValidated > this.TOKEN_VALIDATION_INTERVAL;
  }

  async validateAndSetToken(token: string): Promise<boolean> {
    const validation = this.validateToken(token);
    if (!validation.isValid) {
      console.error('Token validation failed:', validation.error);
      this.tokenState = {
        status: 'error',
        token: null,
        error: validation.error,
        lastValidated: Date.now()
      };
      return false;
    }

    // Set the token globally for mapboxgl
    if (typeof window !== 'undefined') {
      (window as any).mapboxgl = {
        ...(window as any).mapboxgl,
        accessToken: token
      };
    }

    const encryptedToken = this.encryptToken(token);
    localStorage.setItem('mapbox_token', encryptedToken);
    
    this.tokenState = {
      status: 'valid',
      token,
      lastValidated: Date.now()
    };
    
    console.log('Token successfully validated and set');
    return true;
  }

  async getToken(): Promise<string | null> {
    try {
      console.log('Getting token...', { currentStatus: this.tokenState.status });
      
      // Return cached valid token if not stale
      if (this.tokenState.token && !this.isTokenStale()) {
        console.log('Using cached valid token');
        return this.tokenState.token;
      }

      // Prevent multiple simultaneous initialization attempts
      if (this.isInitializing) {
        console.log('Token initialization in progress, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getToken();
      }

      this.isInitializing = true;
      this.tokenState.status = 'loading';
      
      // First check environment variable
      const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
      if (envToken) {
        console.log('Found token in environment');
        if (await this.validateAndSetToken(envToken)) {
          this.isInitializing = false;
          return envToken;
        }
      }

      // Try to get from localStorage
      const encryptedToken = localStorage.getItem('mapbox_token');
      if (encryptedToken) {
        const token = this.decryptToken(encryptedToken);
        console.log('Found token in localStorage');
        if (await this.validateAndSetToken(token)) {
          this.isInitializing = false;
          return token;
        }
      }

      // Try to get from Supabase
      try {
        console.log('Attempting to fetch token from Supabase...');
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          console.log('Found token from Supabase');
          if (await this.validateAndSetToken(data.token)) {
            this.isInitializing = false;
            return data.token;
          }
        } else if (error) {
          console.warn('Failed to get token from Supabase:', error);
        }
      } catch (e) {
        console.warn('Error accessing Supabase function:', e);
      }

      this.tokenState.status = 'error';
      console.log('No valid token found');
      return null;
    } catch (error) {
      console.error('Error in getToken:', error);
      this.tokenState.status = 'error';
      return null;
    } finally {
      this.isInitializing = false;
    }
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
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();

export const getMapboxToken = async () => {
  return await mapboxTokenManager.getToken();
};
