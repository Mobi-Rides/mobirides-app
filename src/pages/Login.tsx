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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const countryCodes = [
  { code: "+267", country: "BW 🇧🇼" },
  { code: "+213", country: "DZ 🇩🇿" },
  { code: "+244", country: "AO 🇦🇴" },
  { code: "+226", country: "BF 🇧🇫" },
  { code: "+257", country: "BI 🇧🇮" },
  { code: "+237", country: "CM 🇨🇲" },
  { code: "+238", country: "CV 🇨🇻" },
  { code: "+236", country: "CF 🇨🇫" },
  { code: "+235", country: "TD 🇹🇩" },
  { code: "+269", country: "KM 🇰🇲" },
  { code: "+242", country: "CG 🇨🇬" },
  { code: "+243", country: "CD 🇨🇩" },
  { code: "+253", country: "DJ 🇩🇯" },
  { code: "+20", country: "EG 🇪🇬" },
  { code: "+240", country: "GQ 🇬🇶" },
  { code: "+291", country: "ER 🇪🇷" },
  { code: "+251", country: "ET 🇪🇹" },
  { code: "+241", country: "GA 🇬🇦" },
  { code: "+220", country: "GM 🇬🇲" },
  { code: "+233", country: "GH 🇬🇭" },
  { code: "+224", country: "GN 🇬🇳" },
  { code: "+245", country: "GW 🇬🇼" },
  { code: "+254", country: "KE 🇰🇪" },
  { code: "+266", country: "LS 🇱🇸" },
  { code: "+231", country: "LR 🇱🇷" },
  { code: "+218", country: "LY 🇱🇾" },
  { code: "+261", country: "MG 🇲🇬" },
  { code: "+265", country: "MW 🇲🇼" },
  { code: "+223", country: "ML 🇲🇱" },
  { code: "+222", country: "MR 🇲🇷" },
  { code: "+230", country: "MU 🇲🇺" },
  { code: "+212", country: "MA 🇲🇦" },
  { code: "+258", country: "MZ 🇲🇿" },
  { code: "+264", country: "NA 🇳🇦" },
  { code: "+227", country: "NE 🇳🇪" },
  { code: "+234", country: "NG 🇳🇬" },
  { code: "+250", country: "RW 🇷🇼" },
  { code: "+239", country: "ST 🇸🇹" },
  { code: "+221", country: "SN 🇸🇳" },
  { code: "+232", country: "SL 🇸🇱" },
  { code: "+252", country: "SO 🇸🇴" },
  { code: "+27", country: "ZA 🇿🇦" },
  { code: "+211", country: "SS 🇸🇸" },
  { code: "+249", country: "SD 🇸🇩" },
  { code: "+268", country: "SZ 🇸🇿" },
  { code: "+255", country: "TZ 🇹🇿" },
  { code: "+228", country: "TG 🇹🇬" },
  { code: "+216", country: "TN 🇹🇳" },
  { code: "+256", country: "UG 🇺🇬" },
  { code: "+260", country: "ZM 🇿🇲" },
  { code: "+263", country: "ZW 🇿🇼" },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone_number: "",
    country_code: "+267"
  });

  const formatPhoneNumber = (number: string) => {
    return number.replace(/[^\d+]/g, '');
  };

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, unverified_phone')
        .eq('id', userId)
        .single();

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

      const formattedPhoneNumber = formatPhoneNumber(`${profileData.country_code}${profileData.phone_number}`);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          unverified_phone: formattedPhoneNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          unverified_phone: formattedPhoneNumber
        }
      });

      if (metadataError) throw metadataError;

      toast.success("Profile updated successfully");
      setShowProfilePrompt(false);
      
      navigate('/');
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
        <DialogContent className="mx-4 rounded-2xl flex-1 max-w-3xl">
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
              <div className="flex gap-2">
                <Select
                  value={profileData.country_code}
                  onValueChange={(value) => setProfileData(prev => ({ ...prev, country_code: value }))}
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
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: formatPhoneNumber(e.target.value) }))}
                  className="flex-1"
                />
              </div>
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
