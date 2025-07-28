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
  reporter_id?: string;
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
}

// Initialize handover steps for a session
export const initializeHandoverSteps = async (handoverSessionId: string) => {
  try {
    // Check if steps already exist
    const { data: existingSteps } = await supabase
      .from("handover_step_completion")
      .select("id")
      .eq("handover_session_id", handoverSessionId);

    if (existingSteps && existingSteps.length > 0) {
      console.log("Handover steps already initialized");
      return true;
    }

    const stepsToInsert = HANDOVER_STEPS.map(step => ({
      handover_session_id: handoverSessionId,
      step_name: step.name,
      step_order: step.order,
      is_completed: false
    }));

    const { error } = await supabase
      .from("handover_step_completion")
      .insert(stepsToInsert);

    if (error) throw error;
    console.log("Handover steps initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing handover steps:", error);
    toast.error("Failed to initialize handover steps");
    return false;
  }
};

// Get handover steps for a session
export const getHandoverSteps = async (handoverSessionId: string) => {
  try {
    const { data, error } = await supabase
      .from("handover_step_completion")
      .select("*")
      .eq("handover_session_id", handoverSessionId)
      .order("step_order");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching handover steps:", error);
    return [];
  }
};

// Complete a handover step with validation and real-time updates
export const completeHandoverStep = async (
  handoverSessionId: string,
  stepName: string,
  completionData?: any
) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) throw new Error("User not authenticated");

    // Get current step info to validate order
    const { data: stepInfo } = await supabase
      .from("handover_step_completion")
      .select("step_order")
      .eq("handover_session_id", handoverSessionId)
      .eq("step_name", stepName)
      .single();

    if (!stepInfo) {
      throw new Error("Step not found");
    }

    // Validate step completion based on step type
    const validationResult = await validateStepCompletion(handoverSessionId, stepName, completionData);
    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return false;
    }

    // The database trigger will enforce dependency validation
    const { error } = await supabase
      .from("handover_step_completion")
      .update({
        is_completed: true,
        completed_by: userData.user.id,
        completion_data: completionData,
        completed_at: new Date().toISOString()
      })
      .eq("handover_session_id", handoverSessionId)
      .eq("step_name", stepName);

    if (error) {
      // Handle dependency validation errors
      if (error.message.includes("Previous steps must be completed")) {
        toast.error("Please complete previous steps first");
      } else {
        throw error;
      }
      return false;
    }
    
    console.log(`Step ${stepName} completed successfully`);
    toast.success(`${stepName.replace('_', ' ')} completed`);
    return true;
  } catch (error) {
    console.error("Error completing handover step:", error);
    if (error.message.includes("Previous steps must be completed")) {
      toast.error("Please complete previous steps in order");
    } else {
      toast.error("Failed to complete handover step");
    }
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

// Create vehicle condition report
export const createVehicleConditionReport = async (report: VehicleConditionReport) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) throw new Error("User not authenticated");

    // Convert arrays to JSON for database storage
    const dbReport = {
      handover_session_id: report.handover_session_id,
      booking_id: report.booking_id,
      car_id: report.car_id,
      report_type: report.report_type,
      vehicle_photos: JSON.stringify(report.vehicle_photos),
      damage_reports: JSON.stringify(report.damage_reports),
      fuel_level: report.fuel_level,
      mileage: report.mileage,
      exterior_condition_notes: report.exterior_condition_notes,
      interior_condition_notes: report.interior_condition_notes,
      additional_notes: report.additional_notes,
      digital_signature_data: report.digital_signature_data,
      is_acknowledged: report.is_acknowledged,
      reporter_id: report.reporter_id || userData.user.id
    };

    const { data, error } = await supabase
      .from("vehicle_condition_reports")
      .insert(dbReport)
      .select()
      .single();

    if (error) throw error;
    console.log("Vehicle condition report created successfully");
    return data;
  } catch (error) {
    console.error("Error creating vehicle condition report:", error);
    toast.error("Failed to create condition report");
    return null;
  }
};

// Update vehicle condition report
export const updateVehicleConditionReport = async (
  reportId: string,
  updates: Partial<VehicleConditionReport>
) => {
  try {
    // Convert arrays to JSON if they exist in updates
    const dbUpdates: any = { ...updates };
    if (updates.vehicle_photos) {
      dbUpdates.vehicle_photos = JSON.stringify(updates.vehicle_photos);
    }
    if (updates.damage_reports) {
      dbUpdates.damage_reports = JSON.stringify(updates.damage_reports);
    }

    const { error } = await supabase
      .from("vehicle_condition_reports")
      .update(dbUpdates)
      .eq("id", reportId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating vehicle condition report:", error);
    toast.error("Failed to update condition report");
    return false;
  }
};

// Create identity verification check
export const createIdentityVerificationCheck = async (check: IdentityVerificationCheck) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) throw new Error("User not authenticated");

    const checkData = {
      handover_session_id: check.handover_session_id,
      verifier_id: userData.user.id, // Set current user as verifier
      verified_user_id: check.verified_user_id,
      verification_photo_url: check.verification_photo_url,
      license_photo_url: check.license_photo_url,
      verification_status: check.verification_status,
      verification_notes: check.verification_notes
    };

    const { data, error } = await supabase
      .from("identity_verification_checks")
      .insert(checkData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating identity verification check:", error);
    toast.error("Failed to create identity verification");
    return null;
  }
};

// Update identity verification status
export const updateIdentityVerificationStatus = async (
  checkId: string,
  status: 'verified' | 'failed',
  notes?: string
) => {
  try {
    const { error } = await supabase
      .from("identity_verification_checks")
      .update({
        verification_status: status,
        verification_notes: notes,
        verified_at: status === 'verified' ? new Date().toISOString() : null
      })
      .eq("id", checkId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating identity verification:", error);
    toast.error("Failed to update verification status");
    return false;
  }
};

// Get vehicle condition reports for handover
export const getVehicleConditionReports = async (handoverSessionId: string) => {
  try {
    const { data, error } = await supabase
      .from("vehicle_condition_reports")
      .select("*")
      .eq("handover_session_id", handoverSessionId);

    if (error) throw error;
    
    // Parse JSON fields back to arrays
    return (data || []).map(report => ({
      ...report,
      vehicle_photos: typeof report.vehicle_photos === 'string' 
        ? JSON.parse(report.vehicle_photos) 
        : report.vehicle_photos || [],
      damage_reports: typeof report.damage_reports === 'string' 
        ? JSON.parse(report.damage_reports) 
        : report.damage_reports || []
    }));
  } catch (error) {
    console.error("Error fetching condition reports:", error);
    return [];
  }
};

// Get identity verification checks for handover
export const getIdentityVerificationChecks = async (handoverSessionId: string) => {
  try {
    const { data, error } = await supabase
      .from("identity_verification_checks")
      .select("*")
      .eq("handover_session_id", handoverSessionId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching identity verification checks:", error);
    return [];
  }
};
