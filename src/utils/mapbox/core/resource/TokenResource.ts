
import { ResourceBase } from './ResourceBase';
import { mapboxTokenManager } from '../../tokenManager';

export class TokenResource extends ResourceBase {
  constructor() {
    super('token');
  }

  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');
      const token = await mapboxTokenManager.getToken();
      if (!token) {
        this.setState('error', 'No token available');
        return false;
      }
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to acquire token');
      return false;
    }
  }

  async release(): Promise<void> {
    try {
      mapboxTokenManager.clearToken();
      this.setState('pending');
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to release token');
    }
  }

  async validate(): Promise<boolean> {
    try {
      const token = mapboxTokenManager.getTokenState().token;
      if (!token) {
        this.setState('error', 'No token to validate');
        return false;
      }
      const isValid = await mapboxTokenManager.validateAndSetToken(token);
      if (!isValid) {
        this.setState('error', 'Token validation failed');
        return false;
      }
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Token validation failed');
      return false;
    }
  }
}
