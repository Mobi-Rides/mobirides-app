
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
  private readonly MAX_RETRIES = 3;
  private retryCount = 0;

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

  private validateToken(token: string): ValidationResult {
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

  private ensureMapboxGlobal(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // If mapboxgl is not on window but exists as a module, set it
      const mapboxgl = require('mapbox-gl');
      if (!window.mapboxgl && mapboxgl) {
        console.log('Setting mapboxgl on window object');
        window.mapboxgl = mapboxgl;
      }
      return true;
    } catch (error) {
      console.error('Error ensuring mapboxgl global:', error);
      return false;
    }
  }

  private async setTokenWithRetry(token: string): Promise<boolean> {
    if (this.retryCount >= this.MAX_RETRIES) {
      console.error('Max retry attempts reached for setting token');
      return false;
    }

    try {
      if (!this.ensureMapboxGlobal()) {
        console.log('Mapboxgl not available, retrying...');
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.setTokenWithRetry(token);
      }

      if (window.mapboxgl) {
        console.log('Setting token on mapboxgl instance');
        window.mapboxgl.accessToken = token;
        // Verify token was set correctly
        if (window.mapboxgl.accessToken === token) {
          console.log('Token successfully set and verified');
          this.retryCount = 0;
          return true;
        }
      }

      console.log('Token setting failed, retrying...');
      this.retryCount++;
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.setTokenWithRetry(token);
    } catch (error) {
      console.error('Error in setTokenWithRetry:', error);
      this.retryCount++;
      if (this.retryCount < this.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.setTokenWithRetry(token);
      }
      return false;
    }
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

    try {
      const tokenSet = await this.setTokenWithRetry(token);
      if (!tokenSet) {
        throw new Error('Failed to set token after multiple attempts');
      }

      const encryptedToken = this.encryptToken(token);
      localStorage.setItem('mapbox_token', encryptedToken);
      
      this.tokenState = {
        status: 'valid',
        token,
        lastValidated: Date.now()
      };
      
      console.log('Token successfully validated and set on mapboxgl instance');
      return true;
    } catch (error) {
      console.error('Error setting token:', error);
      this.tokenState = {
        status: 'error',
        token: null,
        error: 'Failed to set token',
        lastValidated: Date.now()
      };
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      console.log('Getting token...', { currentStatus: this.tokenState.status });
      
      // Return cached valid token if not stale
      if (this.tokenState.token && !this.isTokenStale()) {
        console.log('Using cached valid token');
        // Ensure token is set on mapboxgl instance
        await this.setTokenWithRetry(this.tokenState.token);
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
    if (typeof window !== 'undefined' && window.mapboxgl) {
      window.mapboxgl.accessToken = null;
    }
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

declare global {
  interface Window {
    mapboxgl?: any;
  }
}
