
import { supabase } from "@/integrations/supabase/client";
import { TokenState } from './types';
import { TokenValidator } from './tokenValidator';
import { MapboxInstanceManager } from './instanceManager';

export class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private tokenState: TokenState = {
    status: 'uninitialized',
    token: null,
    lastValidated: 0
  };
  private readonly TOKEN_VALIDATION_INTERVAL = 1800000; // 30 minutes
  private isInitializing = false;
  private instanceManager: MapboxInstanceManager;

  private constructor() {
    console.log('MapboxTokenManager initialized');
    this.instanceManager = new MapboxInstanceManager();
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

  private isTokenStale(): boolean {
    return Date.now() - this.tokenState.lastValidated > this.TOKEN_VALIDATION_INTERVAL;
  }

  async validateAndSetToken(token: string): Promise<boolean> {
    const validation = TokenValidator.validateToken(token);
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
      const tokenSet = await this.instanceManager.setTokenWithRetry(token);
      if (!tokenSet) {
        throw new Error('Failed to set token after multiple attempts');
      }

      const encryptedToken = TokenValidator.encryptToken(token);
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
      
      if (this.tokenState.token && !this.isTokenStale()) {
        console.log('Using cached valid token');
        await this.instanceManager.setTokenWithRetry(this.tokenState.token);
        return this.tokenState.token;
      }

      if (this.isInitializing) {
        console.log('Token initialization in progress, waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getToken();
      }

      this.isInitializing = true;
      this.tokenState.status = 'loading';

      // Try each token source in sequence
      const token = await this.fetchTokenFromSources();
      
      this.isInitializing = false;
      return token;
    } catch (error) {
      console.error('Error in getToken:', error);
      this.tokenState.status = 'error';
      this.isInitializing = false;
      return null;
    }
  }

  private async fetchTokenFromSources(): Promise<string | null> {
    // 1. Try environment variable
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken && await this.validateAndSetToken(envToken)) {
      return envToken;
    }

    // 2. Try localStorage
    const encryptedToken = localStorage.getItem('mapbox_token');
    if (encryptedToken) {
      const token = TokenValidator.decryptToken(encryptedToken);
      if (await this.validateAndSetToken(token)) {
        return token;
      }
    }

    // 3. Try Supabase
    try {
      console.log('Attempting to fetch token from Supabase...');
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (!error && data?.token && await this.validateAndSetToken(data.token)) {
        return data.token;
      }
    } catch (e) {
      console.warn('Error accessing Supabase function:', e);
    }

    this.tokenState.status = 'error';
    return null;
  }

  getTokenState(): TokenState {
    return { ...this.tokenState };
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    localStorage.removeItem('mapbox_token');
    this.instanceManager.clearGlobalInstance();
    this.tokenState = {
      status: 'uninitialized',
      token: null,
      lastValidated: 0
    };
  }
}

// Create and export the singleton instance
export const mapboxTokenManager = MapboxTokenManager.getInstance();

// Export the getToken helper function
export const getMapboxToken = async () => {
  return await mapboxTokenManager.getToken();
};
