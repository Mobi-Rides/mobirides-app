
import { ResourceBase } from './ResourceBase';
import { mapboxTokenManager } from '../../tokenManager';
import { TokenValidator } from '../../tokenValidator';
import { eventBus } from '../eventBus';
import { ResourceConfigs, ResourceType } from './resourceTypes';

export class TokenResource extends ResourceBase {
  private validationTimeout: number = 1800000; // 30 minutes
  private lastValidation: number = 0;
  private config: ResourceConfigs['token'] | null = null;

  constructor() {
    super('token');
  }

  async configure<T extends ResourceType>(config: ResourceConfigs[T]): Promise<boolean> {
    if (this.type !== 'token') return false;

    try {
      const tokenConfig = config as ResourceConfigs['token'];
      this.config = tokenConfig;

      if (tokenConfig.refreshInterval) {
        this.validationTimeout = tokenConfig.refreshInterval;
      }

      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Configuration failed');
      return false;
    }
  }

  async acquire(): Promise<boolean> {
    try {
      console.log('[TokenResource] Starting token acquisition');
      this.setState('loading');

      const token = await mapboxTokenManager.getToken();
      if (!token) {
        console.error('[TokenResource] No token available');
        this.setState('error', 'No token available');
        return false;
      }

      const validation = TokenValidator.validateToken(token);
      if (!validation.isValid) {
        console.error('[TokenResource] Token validation failed:', validation.error);
        this.setState('error', validation.error);
        return false;
      }

      // Test token with Mapbox API
      const isValid = await this.testTokenWithMapbox(token);
      if (!isValid) {
        console.error('[TokenResource] Token API validation failed');
        this.setState('error', 'Token failed Mapbox API validation');
        return false;
      }

      this.lastValidation = Date.now();
      this.setState('ready');
      console.log('[TokenResource] Token successfully acquired and validated');
      return true;
    } catch (error) {
      console.error('[TokenResource] Error during token acquisition:', error);
      this.setState('error', error instanceof Error ? error.message : 'Failed to acquire token');
      return false;
    }
  }

  async release(): Promise<void> {
    try {
      console.log('[TokenResource] Releasing token');
      mapboxTokenManager.clearToken();
      this.setState('pending');
      this.lastValidation = 0;
    } catch (error) {
      console.error('[TokenResource] Error during token release:', error);
      this.setState('error', error instanceof Error ? error.message : 'Failed to release token');
    }
  }

  async validate(): Promise<boolean> {
    try {
      console.log('[TokenResource] Starting token validation');
      const token = mapboxTokenManager.getTokenState().token;
      
      if (!token) {
        console.error('[TokenResource] No token to validate');
        this.setState('error', 'No token to validate');
        return false;
      }

      // Check if we need to revalidate based on configuration
      if (!this.config?.validateOnRefresh && 
          Date.now() - this.lastValidation < this.validationTimeout && 
          this.state.status === 'ready') {
        console.log('[TokenResource] Using cached validation');
        return true;
      }

      const validation = TokenValidator.validateToken(token);
      if (!validation.isValid) {
        console.error('[TokenResource] Token validation failed:', validation.error);
        this.setState('error', validation.error);
        return false;
      }

      const isValid = await this.testTokenWithMapbox(token);
      if (!isValid) {
        console.error('[TokenResource] Token API validation failed');
        this.setState('error', 'Token failed Mapbox API validation');
        return false;
      }

      this.lastValidation = Date.now();
      this.setState('ready');
      console.log('[TokenResource] Token successfully validated');
      return true;
    } catch (error) {
      console.error('[TokenResource] Error during token validation:', error);
      this.setState('error', error instanceof Error ? error.message : 'Token validation failed');
      return false;
    }
  }

  private async testTokenWithMapbox(token: string): Promise<boolean> {
    try {
      console.log('[TokenResource] Testing token with Mapbox API');
      // Test token by attempting to load a tile
      const response = await fetch(
        `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/1/0/0.mvt?access_token=${token}`
      );

      if (!response.ok) {
        console.error('[TokenResource] Token API test failed:', response.status);
        eventBus.emit({
          type: 'error',
          payload: `Token validation failed with status ${response.status}`
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[TokenResource] Error testing token with Mapbox API:', error);
      eventBus.emit({
        type: 'error',
        payload: 'Failed to validate token with Mapbox API'
      });
      return false;
    }
  }
}
