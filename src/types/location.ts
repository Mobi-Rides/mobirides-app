
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

export interface CarGridProps {
  cars: any[];
  isLoading: boolean;
  error: Error | null;
  loadMoreRef: React.RefObject<HTMLDivElement> | null;
  hasMoreItems: boolean;
  onLoadMore: () => void;
}

export interface CarFormData {
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  price_per_day: number;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  features: string[];
}

export interface ProfileEditViewProps {
  profileData: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    phone?: string;
    email?: string;
  };
}
