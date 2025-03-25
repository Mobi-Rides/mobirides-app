
import mapboxgl from 'mapbox-gl';

export class MapboxInstanceManager {
  private static readonly MAX_RETRIES = 3;
  private retryCount = 0;
  private mapboxModule: typeof mapboxgl | null = null;
  private isModuleReady = false;

  async getMapboxModule(): Promise<typeof mapboxgl | null> {
    if (this.mapboxModule) {
      return this.mapboxModule;
    }

    try {
      console.log("Loading mapbox-gl module...");
      // Direct reference to mapboxgl since we're importing it already
      this.mapboxModule = mapboxgl;
      
      // Ensure CSS is loaded
      await import("mapbox-gl/dist/mapbox-gl.css").catch(err => {
        console.warn("Could not load mapbox-gl CSS:", err);
      });
      
      this.isModuleReady = true;
      console.log("Mapbox module loaded successfully");
      return this.mapboxModule;
    } catch (error) {
      console.error("Error loading mapbox-gl module:", error);
      return null;
    }
  }

  async setTokenWithRetry(token: string): Promise<boolean> {
    if (this.retryCount >= MapboxInstanceManager.MAX_RETRIES) {
      console.error("Max retry attempts reached for setting token");
      return false;
    }

    try {
      // Ensure mapbox-gl is loaded
      const module = await this.getMapboxModule();
      if (!module) {
        throw new Error("Failed to load mapbox-gl module");
      }

      // Set the token directly on mapboxgl
      mapboxgl.accessToken = token;
      console.log("Setting token on mapboxgl instance:", token.substring(0, 5) + '...');
      
      // Verify token was set correctly
      if (mapboxgl.accessToken === token) {
        console.log("Token successfully set and verified");
        this.retryCount = 0;
        return true;
      }
      
      console.log("Token setting failed, retrying...");
      this.retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.setTokenWithRetry(token);
    } catch (error) {
      console.error("Error in setTokenWithRetry:", error);
      this.retryCount++;
      if (this.retryCount < MapboxInstanceManager.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.setTokenWithRetry(token);
      }
      return false;
    }
  }

  isReady(): boolean {
    return this.isModuleReady && !!this.mapboxModule && !!mapboxgl.accessToken;
  }

  clearGlobalInstance() {
    mapboxgl.accessToken = '';
    this.mapboxModule = null;
    this.isModuleReady = false;
  }
}

export const mapboxInstanceManager = new MapboxInstanceManager();
