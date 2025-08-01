
export interface TokenState {
  status: 'uninitialized' | 'valid' | 'error' | 'loading';
  token: string | null;
  lastValidated: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

declare global {
  interface Window {
    mapboxgl?: typeof import('mapbox-gl');
  }
}
