
import { ResourceBase } from './ResourceBase';
import { ResourceType, ResourceLoadingState } from './resourceTypes';
import { mapboxTokenManager } from '@/utils/mapbox';

/**
 * Represents the Mapbox access token resource.
 * Responsible for validating the Mapbox token.
 */
export class TokenResource extends ResourceBase {
  protected resourceType: ResourceType = 'token';
  private token: string | null = null;

  constructor() {
    super();
  }

  /**
   * Loads and validates the Mapbox token.
   * @returns A promise that resolves to true if the token is valid, false otherwise.
   */
  async load(): Promise<boolean> {
    try {
      this.setState({ loading: true, error: null });

      // Try to get token from the token manager
      try {
        this.token = await mapboxTokenManager.getToken();
        
        if (!this.token) {
          throw new Error('No token available');
        }
        
        // Validate the token (can extend with actual validation if needed)
        const isValid = this.token.length > 0;
        
        if (!isValid) {
          throw new Error('Invalid token format');
        }
        
        // Set token as loaded
        this.setState({ loading: false, loaded: true });
        return true;
      } catch (error) {
        console.error('Error loading token:', error);
        this.setState({ 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to load Mapbox token'
        });
        return false;
      }
    } catch (error) {
      console.error('Resource load error:', error);
      this.setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error loading token'
      });
      return false;
    }
  }

  /**
   * Reloads the token resource.
   * @returns A promise that resolves to true if the token is reloaded successfully, false otherwise.
   */
  async reload(): Promise<boolean> {
    // Reset state before reloading
    this.setState({ loading: false, loaded: false, error: null });
    this.token = null;
    
    // Clear token in manager to force a refresh
    mapboxTokenManager.clearToken();
    
    return this.load();
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
  getState(): ResourceLoadingState {
    return { ...this.state };
  }
}
