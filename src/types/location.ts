
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
  isLoading?: boolean;
  error?: Error | null;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  hasMoreItems?: boolean;
  onLoadMore?: () => void;
  isFetchingNextPage?: boolean;
  isAuthenticated?: boolean;
}

export type VehicleType = "Basic" | "Standard" | "Executive" | "4x4" | "SUV" | "Electric" | "Exotic";

export interface CarFormData {
  brand: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  price_per_day: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  features: string[];
  fuel: string;
  seats: number;
  transmission: string;
}

export interface ProfileEditViewProps {
  profileData?: {
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    phone?: string;
    email?: string;
    id?: string;  // Adding id as it's part of ProfileData
    phone_number?: string;  // Adding phone_number from ProfileData
    role?: "host" | "renter";  // Adding role from ProfileData
    is_sharing_location?: boolean;  // Adding is_sharing_location from ProfileData
    location_sharing_scope?: string;  // Adding location_sharing_scope from ProfileData
    latitude?: number;  // Adding latitude from ProfileData
    longitude?: number;  // Adding longitude from ProfileData
    created_at?: string;  // Adding created_at from ProfileData
    updated_at?: string;  // Adding updated_at from ProfileData
  };
}
