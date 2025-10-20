import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FullProfileData {
  // Basic Profile
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'renter' | 'host';
  phone_number: string | null;
  email: string;
  created_at: string;
  
  // Verification Data
  dateOfBirth?: string;
  nationalIdNumber?: string;
  address?: {
    street: string;
    area: string;
    city: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  
  // Verification Status
  verificationStatus: string;
  verificationSteps: {
    personal_info: boolean;
    documents: boolean;
    selfie: boolean;
    phone: boolean;
    address: boolean;
  };
  verificationProgress: number;
  
  // Documents
  documents?: Array<{
    id: string;
    document_type: string;
    status: 'pending' | 'verified' | 'rejected';
    uploaded_at: string;
  }>;
}

export const useFullProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['fullProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user ID");

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch verification data
      const { data: verification } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch documents
      const { data: documents } = await supabase
        .from('documents')
        .select('id, document_type, status, uploaded_at')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      // Calculate verification progress
      const steps = [
        verification?.personal_info_completed || false,
        verification?.documents_completed || false,
        verification?.selfie_completed || false,
        verification?.phone_verified || false,
        verification?.address_confirmed || false
      ];
      const progress = Math.round((steps.filter(Boolean).length / steps.length) * 100);

      // Extract personal info from verification JSONB
      const personalInfo = verification?.personal_info as any || {};

      return {
        ...profile,
        email: user.email || '',
        dateOfBirth: personalInfo.dateOfBirth,
        nationalIdNumber: personalInfo.nationalIdNumber,
        address: personalInfo.address,
        emergencyContact: personalInfo.emergencyContact,
        verificationStatus: verification?.overall_status || 'not_started',
        verificationSteps: {
          personal_info: verification?.personal_info_completed || false,
          documents: verification?.documents_completed || false,
          selfie: verification?.selfie_completed || false,
          phone: verification?.phone_verified || false,
          address: verification?.address_confirmed || false
        },
        verificationProgress: progress,
        documents: documents || []
      } as FullProfileData;
    },
    enabled: !!user?.id
  });
};
