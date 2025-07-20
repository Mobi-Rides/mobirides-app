
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import country codes from constants
import countryCodes from "@/constants/Countries";

interface ExtendedProfile {
  full_name?: string;
  phone_number?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
    country_code: "+267",
  });

  const formatPhoneNumber = (number: string) => {
    return number.replace(/[^\d+]/g, "");
  };

  const checkUserProfile = async (userId: string) => {
    try {
      console.log("Checking profile for user:", userId);
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      const profile = data as ExtendedProfile | null;
      console.log("Profile data:", profile);

      if (!profile?.full_name || !profile?.phone_number) {
        setShowProfilePrompt(true);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true);
      console.log("Starting profile update...");

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Authentication error. Please try signing in again.");
        return;
      }

      if (!sessionData.session) {
        console.error("No active session found");
        toast.error("No active session. Please sign in again.");
        return;
      }

      const userId = sessionData.session.user.id;
      console.log("Updating profile for user:", userId);

      const formattedPhoneNumber = formatPhoneNumber(
        `${profileData.country_code}${profileData.phone_number}`
      );

      const updateData: ExtendedProfile & { updated_at: string } = {
        full_name: profileData.full_name,
        phone_number: formattedPhoneNumber,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (profileError) {
        console.error("Profile update error:", profileError);
        toast.error("Failed to update profile");
        return;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          phone_number: formattedPhoneNumber,
        },
      });

      if (metadataError) {
        console.error("Metadata update error:", metadataError);
        toast.error("Failed to update user metadata");
        return;
      }

      console.log("Profile update successful");
      toast.success("Profile updated successfully");
      setShowProfilePrompt(false);
      navigate("/");
    } catch (error) {
      console.error("Error in profile update:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    console.log("Login: Checking session");
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, checking profile");
        checkUserProfile(session.user.id);
      }

      if (event === "SIGNED_OUT") {
        console.log("User signed out");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const checkSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error checking session:", error);
        toast.error("There was an error checking your session");
        return;
      }

      if (session) {
        console.log("Active session found, checking profile");
        await checkUserProfile(session.user.id);
      }
    } catch (error) {
      console.error("Error in checkSession:", error);
      toast.error("There was an error checking your session");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src="/lovable-uploads/a065be26-80b7-4e50-b683-b6afb0add925.png"
            alt="Mobirides Logo"
            className="mx-auto h-48 w-48"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to <span className="text-[#7C3AED]">Mobirides</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to start sharing or renting cars
          </p>
        </div>

        <div className="mt-8">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#7C3AED",
                    brandAccent: "#6D28D9",
                  },
                },
              },
            }}
            theme="light"
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  link_text: "",
                },
              },
            }}
          />
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-[#7C3AED] hover:text-[#6D28D9]"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      <Dialog open={showProfilePrompt} onOpenChange={setShowProfilePrompt}>
        <DialogContent className="max-w-3xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={profileData.full_name}
                onChange={(e) =>
                  setProfileData((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Select
                  value={profileData.country_code}
                  onValueChange={(value) =>
                    setProfileData((prev) => ({ ...prev, country_code: value }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map(({ code, country }) => (
                      <SelectItem key={code} value={code}>
                        {country} ({code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={profileData.phone_number}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      phone_number: formatPhoneNumber(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleProfileUpdate}
              disabled={
                isUpdating ||
                !profileData.full_name ||
                !profileData.phone_number
              }
            >
              {isUpdating ? "Updating..." : "Save Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
