
import { ResourceBase } from './ResourceBase';
import { ResourceType, ResourceState } from './resourceTypes';
import { mapboxTokenManager } from '@/utils/mapbox';

/**
 * Represents the Mapbox access token resource.
 * Responsible for validating the Mapbox token.
 */
export class TokenResource extends ResourceBase {
  private token: string | null = null;

  constructor() {
    super('token');
  }

  /**
   * Loads and validates the Mapbox token.
   * @returns A promise that resolves to true if the token is valid, false otherwise.
   */
  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');

      // Try to get token from the token manager
      try {
        this.token = await mapboxTokenManager.getToken();
        
        if (!this.token) {
          this.setState('error', 'No token available');
          return false;
        }
        
        // Validate the token (can extend with actual validation if needed)
        const isValid = this.token.length > 0;
        
        if (!isValid) {
          this.setState('error', 'Invalid token format');
          return false;
        }
        
        // Set token as loaded
        this.setState('ready');
        return true;
      } catch (error) {
        console.error('Error loading token:', error);
        this.setState('error', error instanceof Error ? error.message : 'Failed to load Mapbox token');
        return false;
      }
    } catch (error) {
      console.error('Resource load error:', error);
      this.setState('error', error instanceof Error ? error.message : 'Unknown error loading token');
      return false;
    }
  }

  /**
   * Releases the token resource.
   */
  async release(): Promise<void> {
    this.token = null;
    this.setState('pending');
  }

  /**
   * Validates the token resource.
   * @returns A promise that resolves to true if the token is valid, false otherwise.
   */
  async validate(): Promise<boolean> {
    // This checks if we have a valid token from tokenManager's state
    const tokenState = mapboxTokenManager.getTokenState();
    if (tokenState.token && tokenState.valid) {
      this.setState('ready');
      return true;
    }
    this.setState('error', 'Token not valid');
    return false;
  }

  /**
   * Configures the token resource.
   * @returns A promise that resolves to true if configuration is successful, false otherwise.
   */
  async configure<T extends ResourceType>(config: any): Promise<boolean> {
    // No special configuration needed for token resource
    return true;
  }

  /**
   * Gets the current token.
   * @returns The current token, or null if not loaded.
   */
  getToken(): string | null {
    // This checks if we have a valid token from tokenManager's state
    const tokenState = mapboxTokenManager.getTokenState();
    return tokenState.token;
  }

  /**
   * Gets the current state of the token resource.
   * @returns The current state.
   */
  getState(): ResourceState {
    return this.state;
  }
}
