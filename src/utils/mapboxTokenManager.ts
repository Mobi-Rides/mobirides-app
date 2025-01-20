class MapboxTokenManager {
  private static instance: MapboxTokenManager;
  private token: string | null = null;
  private tokenPromise: Promise<string | null> | null = null;

  private constructor() {
    console.log('MapboxTokenManager initialized');
  }

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  async getToken(): Promise<string | null> {
    // Return cached token if available
    if (this.token) {
      console.log('Using cached Mapbox token');
      return this.token;
    }

    // If there's an ongoing token fetch, return its promise
    if (this.tokenPromise) {
      console.log('Using existing token fetch promise');
      return this.tokenPromise;
    }

    // Try to get token from localStorage first
    const localToken = localStorage.getItem('mapbox_token');
    if (localToken) {
      console.log('Using token from localStorage');
      this.token = localToken;
      return localToken;
    }

    // If no token is found, return null to trigger the MapboxConfig component
    return null;
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    this.token = null;
    this.tokenPromise = null;
    localStorage.removeItem('mapbox_token');
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();