
import { Navigation } from "@/components/Navigation";
import { useParams, useNavigate } from "react-router-dom";
import { ProfileEditView } from "@/components/profile/ProfileEditView";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProfileLoading } from "@/components/profile/ProfileLoading";
import { ProfileError } from "@/components/profile/ProfileError";

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
      return data;
    },
  });

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return <ProfileError error={error as Error} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
          <ProfileEditView profile={profile} />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default EditProfile;
