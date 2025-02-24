
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
  });

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, unverified_phone')
        .eq('id', userId)
        .single();

      // Show prompt if either full_name or phone is missing
      if (!profile?.full_name || !profile?.unverified_phone) {
        setShowProfilePrompt(true);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          unverified_phone: profileData.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          unverified_phone: profileData.phone_number
        }
      });

      if (metadataError) throw metadataError;

      toast.success("Profile updated successfully");
      setShowProfilePrompt(false);
      
      // Navigate to the intended destination
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    console.log("Login: Checking session");
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
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
            src="/lovable-uploads/5f01f258-2bf0-42c9-a69a-83350aa11d7f.png"
            alt="Mobirides Logo"
            className="mx-auto h-48 w-48"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to <span className="text-[#7C3AED]">Mobirides</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? "Create an account to start sharing or renting cars" : "Sign in to start sharing or renting cars"}
          </p>
        </div>
        
        <div className="mt-8">
          {isSignUp ? (
            <>
              <SignUpForm />
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#7C3AED',
                        brandAccent: '#6D28D9',
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
                    }
                  }
                }}
              />
              <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <Dialog open={showProfilePrompt} onOpenChange={setShowProfilePrompt}>
        <DialogContent>
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
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={profileData.phone_number}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleProfileUpdate}
              disabled={isUpdating || !profileData.full_name || !profileData.phone_number}
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
