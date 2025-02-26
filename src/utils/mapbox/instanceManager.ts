
export class MapboxInstanceManager {
  private static readonly MAX_RETRIES = 3;
  private retryCount = 0;

  async setTokenWithRetry(token: string): Promise<boolean> {
    if (this.retryCount >= MapboxInstanceManager.MAX_RETRIES) {
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
      if (this.retryCount < MapboxInstanceManager.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.setTokenWithRetry(token);
      }
      return false;
    }
  }

  private ensureMapboxGlobal(): boolean {
    if (typeof window === 'undefined') return false;

    try {
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

  clearGlobalInstance() {
    if (typeof window !== 'undefined' && window.mapboxgl) {
      window.mapboxgl.accessToken = null;
    }
  }
}
