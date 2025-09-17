
// This file extends the types for profiles to include fields not in the auto-generated types

export interface ExtendedProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  
  // Fields from migration that aren't in the types.ts
  is_sharing_location?: boolean;
  location_sharing_scope?: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  
  // Added for active handover identification
  isActiveHandover?: boolean;
}

// Type guard function to check if location sharing fields exist
export const hasLocationFields = (profile: unknown): boolean => {
  return profile && 
    typeof profile === 'object' &&
    'is_sharing_location' in profile && 
    'location_sharing_scope' in profile;
};

// Helper function to create location update payload
export const createLocationUpdatePayload = (
  isSharing: boolean, 
  coords?: { latitude: number; longitude: number }
) => {
  const payload: {
    is_sharing_location: boolean;
    updated_at: string;
    latitude?: number;
    longitude?: number;
  } = {
    is_sharing_location: isSharing,
    updated_at: new Date().toISOString()
  };
  
  if (isSharing && coords) {
    payload.latitude = coords.latitude;
    payload.longitude = coords.longitude;
  }
  
  return payload;
};
