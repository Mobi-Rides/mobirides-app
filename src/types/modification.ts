export interface BookingModificationRequest {
  id: string;
  booking_id: string;
  modification_type: ModificationType;
  original_start_time?: string;
  original_end_time?: string;
  requested_start_time?: string;
  requested_end_time?: string;
  original_pickup_latitude?: number;
  original_pickup_longitude?: number;
  original_pickup_address?: string;
  requested_pickup_latitude?: number;
  requested_pickup_longitude?: number;
  requested_pickup_address?: string;
  reason?: string;
  status: ModificationStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
}

export enum ModificationType {
  TIME_CHANGE = "time_change",
  LOCATION_CHANGE = "location_change",
  BOTH = "both"
}

export enum ModificationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected", 
  CANCELLED = "cancelled"
}

export interface ModificationRequestData {
  modificationType: ModificationType;
  newStartTime?: string;
  newEndTime?: string;
  newLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  reason?: string;
}

export interface ModificationApprovalData {
  modificationId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface TimeChangeValidation {
  isValid: boolean;
  message?: string;
  conflictsWithOtherBookings?: boolean;
}

export interface LocationChangeValidation {
  isValid: boolean;
  message?: string;
  distanceFromOriginal?: number;
  isReasonableDistance?: boolean;
} 