import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";
import { compressImage, isImageFile, formatFileSize } from "@/utils/imageCompression";

// Consolidated 8-step handover flow (MOB-501)
export const HANDOVER_STEPS = [
  { name: "location_selection",    order: 1, owner: "host",    title: "Select Location",        description: "Host selects handover location" },
  { name: "confirm_and_head_out",  order: 2, owner: "renter",  title: "Confirm & Head Out",      description: "Renter confirms location and marks en route" },
  { name: "arrival_confirmation",  order: 3, owner: "both",    title: "Arrival Confirmation",    description: "Both confirm arrival at location" },
  { name: "identity_verification", order: 4, owner: "host",    title: "Identity Verification",   description: "Host verifies renter's identity" },
  { name: "vehicle_inspection",    order: 5, owner: "dynamic", title: "Vehicle Inspection",       description: "Pickup: renter inspects; Return: host inspects" },
  { name: "damage_documentation",  order: 6, owner: "both",    title: "Damage Documentation",    description: "Both acknowledge damage state" },
  { name: "key_exchange",          order: 7, owner: "both",    title: "Key Exchange",            description: "Both confirm key handover" },
  { name: "sign_and_complete",     order: 8, owner: "both",    title: "Sign & Complete",         description: "Both sign and confirm handover complete" },
];

// Legacy step names for backward compatibility with active sessions
export const LEGACY_STEP_NAMES = [
  "location_confirmation", "en_route_confirmation", "host_en_route",
  "vehicle_inspection_exterior", "vehicle_inspection_interior",
  "fuel_mileage_check", "key_transfer", "key_receipt",
  "digital_signature", "completion"
];

export interface VehiclePhoto {
  id: string;
  type: 'exterior_front' | 'exterior_back' | 'exterior_left' | 'exterior_right' | 'dashboard' | 'interior_dashboard' | 'interior_seats' | 'fuel_gauge' | 'odometer' | 'damage_specific';
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
  completion_data?: Record<string, unknown>;
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
      return true;
    }

    const stepsToInsert = HANDOVER_STEPS.map(step => ({
      handover_session_id: handoverSessionId,
      step_name: step.name,
      step_order: step.order,
      step_owner: step.owner,
      is_completed: false
    }));

    const { error } = await supabase
      .from("handover_step_completion")
      .insert(stepsToInsert);

    if (error) throw error;
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
  userRole: 'host' | 'renter',
  completionData?: Record<string, unknown>
) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      throw new Error("User not authenticated");
    }

    // Validate step completion based on step type
    const validationResult = await validateStepCompletion(handoverSessionId, stepName, completionData);
    
    if (!validationResult.isValid) {
      toast.error(validationResult.message);
      return false;
    }

    // Use the RPC function to advance the step
    const { data, error } = await supabase.rpc('advance_handover_step', {
      p_session_id: handoverSessionId,
      p_completed_step_name: stepName,
      p_user_id: userData.user.id,
      p_user_role: userRole,
      p_completion_data: (completionData || {}) as any
    });

    if (error) {
      console.error("RPC error completing step:", error);
      toast.error(`Failed to complete step: ${error.message}`);
      return false;
    }
    
    const result = data as any;
    if (!result.success) {
      toast.error(result.error || "Failed to complete step");
      return false;
    }
    
    toast.success(`${stepName.replace(/_/g, ' ')} completed`);
    return true;
  } catch (error) {
    console.error(`Error completing handover step ${stepName}:`, error);
    toast.error(`Failed to complete handover step: ${error.message}`);
    return false;
  }
};

// Validate step completion based on step type and requirements
const validateStepCompletion = async (
  handoverSessionId: string,
  stepName: string,
  completionData?: Record<string, unknown>
): Promise<{ isValid: boolean; message: string }> => {
  switch (stepName) {
    case "location_selection":
      if (!completionData?.latitude || !completionData?.longitude || !completionData?.address) {
        return { isValid: false, message: "Location coordinates and address are required" };
      }
      break;

    case "confirm_and_head_out":
      // No special data needed — just a confirmation action
      break;

    case "identity_verification":
      if (completionData?.verified === undefined) {
        return { isValid: false, message: "Verification status is required" };
      }
      if (completionData?.verified && !completionData?.photoUrl) {
        return { isValid: false, message: "Identity verification photo is required" };
      }
      break;

    case "vehicle_inspection":
      if (!completionData?.photos || !Array.isArray(completionData.photos) || completionData.photos.length < 5) {
        return { isValid: false, message: "At least 5 inspection photos are required (front, rear, left, right, dashboard)" };
      }
      break;

    // Legacy step names — allow through for backward compat
    case "vehicle_inspection_exterior":
    case "vehicle_inspection_interior":
      if (!completionData?.photos || !Array.isArray(completionData.photos) || completionData.photos.length === 0) {
        return { isValid: false, message: "At least one inspection photo is required" };
      }
      break;

    case "fuel_mileage_check": {
      // Legacy step — keep validation for active sessions
      if (completionData?.fuel_level === undefined || completionData?.mileage === undefined) {
        return { isValid: false, message: "Fuel level and mileage are required" };
      }
      const fuelLevel = Number(completionData.fuel_level);
      if (isNaN(fuelLevel) || fuelLevel < 0 || fuelLevel > 100) {
        return { isValid: false, message: "Fuel level must be between 0 and 100%" };
      }
      const mileage = Number(completionData.mileage);
      if (isNaN(mileage) || mileage < 0) {
        return { isValid: false, message: "Mileage must be a positive number" };
      }
      break;
    }

    case "key_exchange":
      // Dual-party confirmation — no special data needed per party
      break;

    case "sign_and_complete":
    case "digital_signature":
      if (!completionData?.signature) {
        return { isValid: false, message: "Digital signature is required" };
      }
      break;
    
    default:
      // No specific validation for other steps (arrival_confirmation, damage_documentation, legacy steps)
      break;
  }
  
  return { isValid: true, message: "Validation passed" };
};

// Upload handover photo with compression and retry mechanism
export const uploadHandoverPhoto = async (
  file: File,
  handoverSessionId: string,
  photoType: string,
  maxRetries: number = 3,
  onProgress?: (progress: number) => void
): Promise<string | null> => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("User not authenticated");

      onProgress?.(10); // Starting compression
      
      let fileToUpload = file;
      
      // Compress image if it's an image file and larger than 500KB
      if (isImageFile(file) && file.size > 500 * 1024) {
        const originalSize = formatFileSize(file.size);
        
        try {
          fileToUpload = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeKB: 1024
          });
          
          const compressedSize = formatFileSize(fileToUpload.size);
          const compressionRatio = ((file.size - fileToUpload.size) / file.size * 100).toFixed(1);
          
          console.log(`Image compressed: ${originalSize} → ${compressedSize} (${compressionRatio}% reduction)`);
          toast.success(`Image optimized: ${compressionRatio}% smaller`);
        } catch (compressionError) {
          console.warn("Image compression failed, uploading original:", compressionError);
          toast.info("Uploading original image (compression failed)");
          fileToUpload = file;
        }
      }
      
      onProgress?.(30); // Compression complete, starting upload

      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${userData.user.id}/${handoverSessionId}/${photoType}_${Date.now()}.${fileExt}`;

      onProgress?.(50); // Upload starting
      
      const { error: uploadError } = await supabase.storage
        .from('handover-photos')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;
      
      onProgress?.(80); // Upload complete, getting URL

      const { data: { publicUrl } } = supabase.storage
        .from('handover-photos')
        .getPublicUrl(fileName);

      onProgress?.(100); // Complete
      
      const finalSize = formatFileSize(fileToUpload.size);
      toast.success(`Photo uploaded successfully (${finalSize})`);
      
      return publicUrl;
    } catch (error) {
      attempt++;
      console.error(`Photo upload attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        toast.error("Failed to upload photo after multiple attempts");
        onProgress?.(0); // Reset progress on failure
        return null;
      }
      
      toast.info(`Upload failed, retrying... (${attempt}/${maxRetries})`);
      onProgress?.(0); // Reset progress for retry
      
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
    const dbUpdates: Record<string, unknown> = { ...updates };
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
