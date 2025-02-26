
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

  private constructor() {
    console.log('MapboxTokenManager initialized');
  }

  static getInstance(): MapboxTokenManager {
    if (!MapboxTokenManager.instance) {
      MapboxTokenManager.instance = new MapboxTokenManager();
    }
    return MapboxTokenManager.instance;
  }

  validateToken(token: string): ValidationResult {
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

  setToken(token: string) {
    console.log('Setting new token');
    const validation = this.validateToken(token);
    if (!validation.isValid) {
      console.error('Invalid token format:', validation.error);
      this.tokenState = {
        status: 'error',
        token: null,
        error: validation.error,
        lastValidated: Date.now()
      };
      return;
    }

    const encryptedToken = this.encryptToken(token);
    localStorage.setItem('mapbox_token', encryptedToken);
    
    this.tokenState = {
      status: 'valid',
      token,
      lastValidated: Date.now()
    };
    
    console.log('Token successfully set and encrypted');
  }

  async getToken(): Promise<string | null> {
    // Return cached valid token if not stale
    if (this.tokenState.token && !this.isTokenStale()) {
      console.log('Using cached Mapbox token');
      return this.tokenState.token;
    }

    // Try to get from localStorage
    const encryptedToken = localStorage.getItem('mapbox_token');
    if (encryptedToken) {
      try {
        const token = this.decryptToken(encryptedToken);
        const validation = this.validateToken(token);
        if (validation.isValid) {
          console.log('Using validated token from localStorage');
          this.tokenState = {
            status: 'valid',
            token,
            lastValidated: Date.now()
          };
          return token;
        } else {
          console.warn('Invalid token in localStorage:', validation.error);
        }
      } catch (error) {
        console.error('Error decrypting token:', error);
      }
    }

    console.log('No valid token found in local storage');
    return null;
  }

  getTokenState(): TokenState {
    return { ...this.tokenState };
  }

  clearToken() {
    console.log('Clearing cached Mapbox token');
    localStorage.removeItem('mapbox_token');
    this.tokenState = {
      status: 'uninitialized',
      token: null,
      lastValidated: 0
    };
  }
}

export const mapboxTokenManager = MapboxTokenManager.getInstance();
