import { RoleSelector } from "@/components/RoleSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-10 w-full max-w-sm bg-gray-200 rounded mb-4"></div>
          <div className="h-10 w-full max-w-sm bg-gray-200 rounded"></div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link to="/bookings">
          <Button variant="outline" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            My Bookings
          </Button>
        </Link>
      </div>
      
      <ProfileAvatar 
        avatarUrl={avatarUrl} 
        setAvatarUrl={setAvatarUrl} 
      />

      <ProfileForm 
        initialValues={initialFormValues}
      />

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Select Your Role</h2>
        <RoleSelector />
      </div>
      <Navigation />
    </div>
  );
};

export default Profile;