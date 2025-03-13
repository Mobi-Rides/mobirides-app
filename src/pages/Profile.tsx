import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { RoleSection } from "@/components/profile/RoleSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { OnlineStatusToggle } from "@/components/profile/OnlineStatusToggle";
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
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
    };

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error("No authenticated user found");
        }

        console.log("Loading profile data...");
        const { data, error } = await supabase
          .from("profiles")
          .select("avatar_url, full_name")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;

        if (data) {
          console.log("Profile data loaded:", {
            avatarUrl: data.avatar_url,
            fullName: data.full_name,
          });
          setAvatarUrl(data.avatar_url);
          setInitialFormValues({ full_name: data.full_name || "" });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) return <ProfileLoading />;
  if (error) return <ProfileError error={error} />;

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <ProfileAvatar avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} />
      <ProfileHeader />
      <ProfileForm initialValues={initialFormValues} />
      <NotificationsSection />
      <RoleSection />
      <Navigation />
    </div>
  );
};

export default Profile;
