import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { RoleSection } from "@/components/profile/RoleSection";
import { ProfileLoading } from "@/components/profile/ProfileLoading";
import { ProfileError } from "@/components/profile/ProfileError";
import { Navigation } from "@/components/Navigation";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialFormValues, setInitialFormValues] = useState({ full_name: "" });
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    loadProfile();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setAvatarUrl(data.avatar_url);
        setInitialFormValues({ full_name: data.full_name || "" });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ProfileLoading />;
  if (error) return <ProfileError error={error} />;

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <ProfileHeader />
      <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
      <ProfileForm initialValues={initialFormValues} />
      <RoleSection />
      <Navigation />
    </div>
  );
};

export default Profile;