import mapboxgl from 'mapbox-gl';

export interface LocationState {
  watchId: number | null;
  userMarker: mapboxgl.Marker | null;
}

export interface LocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

export interface LocationHandlers {
  handleSuccess: (position: GeolocationPosition) => void;
  handleError: (error: GeolocationPositionError) => void;
}