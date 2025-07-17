
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

// Enhanced handover step definitions
export const HANDOVER_STEPS = [
  { name: "identity_verification", order: 1, title: "Identity Verification", description: "Verify each other's identity" },
  { name: "vehicle_inspection_exterior", order: 2, title: "Exterior Inspection", description: "Document vehicle exterior condition" },
  { name: "vehicle_inspection_interior", order: 3, title: "Interior Inspection", description: "Document vehicle interior condition" },
  { name: "damage_documentation", order: 4, title: "Damage Documentation", description: "Record any existing damage" },
  { name: "fuel_mileage_check", order: 5, title: "Fuel & Mileage", description: "Record current fuel level and mileage" },
  { name: "key_transfer", order: 6, title: "Key Transfer", description: "Physical transfer of vehicle keys" },
  { name: "digital_signature", order: 7, title: "Digital Acknowledgment", description: "Sign handover agreement" },
  { name: "completion", order: 8, title: "Handover Complete", description: "Finalize the handover process" }
];

export interface VehiclePhoto {
  id: string;
  type: 'exterior_front' | 'exterior_back' | 'exterior_left' | 'exterior_right' | 'interior_dashboard' | 'interior_seats' | 'fuel_gauge' | 'odometer' | 'damage_specific';
  url: string;
  description?: string;
  timestamp: string;
}

export interface DamageReport {
  id: string;
  location: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  photos: string[];
  timestamp: string;
}

export interface VehicleConditionReport {
  id?: string;
  handover_session_id: string;
  booking_id: string;
  car_id: string;
  report_type: 'pickup' | 'return';
  vehicle_photos: VehiclePhoto[];
  damage_reports: DamageReport[];
  fuel_level?: number;
  mileage?: number;
  exterior_condition_notes?: string;
  interior_condition_notes?: string;
  additional_notes?: string;
  digital_signature_data?: string;
  is_acknowledged: boolean;
}

export interface IdentityVerificationCheck {
  id?: string;
  handover_session_id: string;
  verifier_id: string;
  verified_user_id: string;
  verification_photo_url?: string;
  license_photo_url?: string;
  verification_status: 'pending' | 'verified' | 'failed';
  verification_notes?: string;
}

export interface HandoverStepCompletion {
  id?: string;
  handover_session_id: string;
  step_name: string;
  step_order: number;
  completed_by?: string;
  is_completed: boolean;
  completion_data?: any;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Mock function to simulate initialization until the types are updated
export const initializeHandoverSteps = async (handoverSessionId: string) => {
  try {
    console.log("Handover steps initialized for session:", handoverSessionId);
    return true;
  } catch (error) {
    console.error("Error initializing handover steps:", error);
    toast.error("Failed to initialize handover steps");
    return false;
  }
};

// Mock function to return sample handover steps
export const getHandoverSteps = async (handoverSessionId: string): Promise<HandoverStepCompletion[]> => {
  try {
    // Return mock data for now until the database types are updated
    return HANDOVER_STEPS.map(step => ({
      id: `mock-${step.name}`,
      handover_session_id: handoverSessionId,
      step_name: step.name,
      step_order: step.order,
      is_completed: false,
      completion_data: {}
    }));
  } catch (error) {
    console.error("Error fetching handover steps:", error);
    return [];
  }
};

// Mock function to complete a handover step
export const completeHandoverStep = async (
  handoverSessionId: string,
  stepName: string,
  completionData?: any
) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) throw new Error("User not authenticated");

    // Validate step completion based on step type
    const validationResult = await validateStepCompletion(handoverSessionId, stepName, completionData);
    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return false;
    }

    console.log(`Step ${stepName} completed successfully`);
    return true;
  } catch (error) {
    console.error("Error completing handover step:", error);
    toast.error("Failed to complete handover step");
    return false;
  }
};

// Validate step completion
const validateStepCompletion = async (
  handoverSessionId: string,
  stepName: string,
  completionData?: any
): Promise<{ isValid: boolean; message: string }> => {
  switch (stepName) {
    case "fuel_mileage_check":
      if (!completionData?.fuel_level || !completionData?.mileage) {
        return { isValid: false, message: "Fuel level and mileage are required" };
      }
      if (completionData.fuel_level < 0 || completionData.fuel_level > 100) {
        return { isValid: false, message: "Fuel level must be between 0 and 100%" };
      }
      if (completionData.mileage < 0) {
        return { isValid: false, message: "Mileage must be a positive number" };
      }
      break;
    
    case "digital_signature":
      if (!completionData?.signature) {
        return { isValid: false, message: "Digital signature is required" };
      }
      break;
    
    default:
      // No specific validation needed for other steps
      break;
  }
  
  return { isValid: true, message: "Validation passed" };
};

// Upload handover photo with retry mechanism
export const uploadHandoverPhoto = async (
  file: File,
  handoverSessionId: string,
  photoType: string,
  maxRetries: number = 3
): Promise<string | null> => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("User not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${userData.user.id}/${handoverSessionId}/${photoType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('handover-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('handover-photos')
        .getPublicUrl(fileName);

      console.log(`Photo uploaded successfully: ${fileName}`);
      return publicUrl;
    } catch (error) {
      attempt++;
      console.error(`Photo upload attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        toast.error("Failed to upload photo after multiple attempts");
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return null;
};

// Mock functions for other operations
export const createVehicleConditionReport = async (report: VehicleConditionReport) => {
  console.log("Vehicle condition report created (mock):", report);
  return { id: "mock-report-id", ...report };
};

export const updateVehicleConditionReport = async (reportId: string, updates: Partial<VehicleConditionReport>) => {
  console.log("Update vehicle condition report (mock):", reportId, updates);
  return true;
};

export const createIdentityVerificationCheck = async (check: IdentityVerificationCheck) => {
  console.log("Identity verification check created (mock):", check);
  return { id: "mock-check-id", ...check };
};

export const updateIdentityVerificationStatus = async (checkId: string, status: 'verified' | 'failed', notes?: string) => {
  console.log("Update identity verification status (mock):", checkId, status, notes);
  return true;
};

export const getVehicleConditionReports = async (handoverSessionId: string) => {
  console.log("Get vehicle condition reports (mock):", handoverSessionId);
  return [];
};

export const getIdentityVerificationChecks = async (handoverSessionId: string) => {
  console.log("Get identity verification checks (mock):", handoverSessionId);
  return [];
};
