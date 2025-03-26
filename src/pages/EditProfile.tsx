
import { Navigation } from "@/components/Navigation";
import { useParams, useNavigate } from "react-router-dom";
import { ProfileEditView } from "@/components/profile/ProfileEditView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileLoading } from "@/components/profile/ProfileLoading";
import { ProfileError } from "@/components/profile/ProfileError";

// Define ProfileData type
interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string;
  phone_number: string;
  role: "host" | "renter";
  is_sharing_location: boolean;
  location_sharing_scope: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

const EditProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user || session.session.user.id !== id) {
        throw new Error("Unauthorized");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ProfileData;
    },
  });

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return <ProfileError error={(error as Error)?.message || "Error loading profile"} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
          <ProfileEditView profileData={{
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            phone: profile.phone_number,
            role: profile.role,
            id: profile.id,
            phone_number: profile.phone_number,
            is_sharing_location: profile.is_sharing_location,
            location_sharing_scope: profile.location_sharing_scope,
            latitude: profile.latitude,
            longitude: profile.longitude,
            created_at: profile.created_at,
            updated_at: profile.updated_at
          }} />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default EditProfile;
