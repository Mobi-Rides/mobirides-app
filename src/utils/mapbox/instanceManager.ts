export class MapboxInstanceManager {
  private static readonly MAX_RETRIES = 3;
  private retryCount = 0;
  private mapboxModule: typeof import("mapbox-gl") | null = null;
  private isModuleReady = false;

  async getMapboxModule(): Promise<typeof import("mapbox-gl") | null> {
    if (this.mapboxModule) {
      return this.mapboxModule;
    }

    try {
      console.log("Loading mapbox-gl module...");
      this.mapboxModule = await import("mapbox-gl");
      await import("mapbox-gl/dist/mapbox-gl.css");
      this.isModuleReady = true;
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

      if (!window.mapboxgl) {
        console.log("Setting mapboxgl on window object");
        window.mapboxgl = module;
      }

      if (window.mapboxgl) {
        console.log("Setting token on mapboxgl instance");
        window.mapboxgl.accessToken = token;
        // Verify token was set correctly
        if (window.mapboxgl.accessToken === token) {
          console.log("Token successfully set and verified");
          this.retryCount = 0;
          return true;
        }
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
    return this.isModuleReady && !!this.mapboxModule;
  }

  clearGlobalInstance() {
    if (typeof window !== "undefined" && window.mapboxgl) {
      window.mapboxgl.accessToken = null;
    }
    this.mapboxModule = null;
    this.isModuleReady = false;
  }
}
