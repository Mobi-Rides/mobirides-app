export interface RentalExtensionRequest {
  id: string;
  booking_id: string;
  current_end_date: string;
  requested_end_date: string;
  additional_days: number;
  additional_cost: number;
  reason?: string;
  status: ExtensionStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
}

export enum ExtensionStatus {
  PENDING = "pending",
  APPROVED = "approved", 
  REJECTED = "rejected",
  CANCELLED = "cancelled"
}

export interface ExtensionRequestData {
  newEndDate: Date;
  reason?: string;
}

export interface ExtensionApprovalData {
  extensionId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface ExtensionCalculation {
  additionalDays: number;
  pricePerDay: number;
  additionalCost: number;
  totalNewCost: number;
  available: boolean;
  conflictingBookings?: string[];
}

export interface ExtensionNotification {
  type: 'extension_requested' | 'extension_approved' | 'extension_rejected';
  extensionId: string;
  bookingId: string;
  recipientId: string;
  message: string;
} 