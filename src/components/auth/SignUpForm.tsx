=======

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";
import { trackUserRegistered, trackGuestSessionEndOnRegistration, trackGuestInteraction, trackAuthTrigger } from "@/utils/analytics";
=======
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, User, Phone, Lock } from "lucide-react";

// Import country codes from constants
import countryCodes from "@/constants/Countries";

=======
interface SignUpFormProps {
  onSuccess?: () => void;
}

interface ExtendedProfile {
  full_name?: string;
  phone_number?: string;
}

export const SignUpForm = () => {
=======
export const SignUpForm = ({ onSuccess }: SignUpFormProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+267"); // Default to Botswana
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
=======
  const navigate = useNavigate();

  const formatPhoneNumber = (number: string) => {
    // Remove any non-digit characters except plus sign
    const cleaned = number.replace(/[^\d+]/g, "");
    return cleaned;
  };

  const handleFormStart = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackGuestInteraction('form_start');
      trackAuthTrigger('form_start', 'signup_form');
    }
  };

=======
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password match
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);

      // Format the phone number to E.164 format
      const formattedPhoneNumber = formatPhoneNumber(
        `${countryCode}${phoneNumber}`
      );
      console.log("Signup attempt with:", {
        email,
        phone_number: formattedPhoneNumber,
        display_name: username,
      });

      // First create the user account with metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            unverified_phone: formattedPhoneNumber, // Store in metadata
            display_name: username,
          },
        },
      });

      console.log("Signup response:", {
        data,
        error: signUpError,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        console.log("User metadata after creation:", data.user.user_metadata);

        // Check if profile already exists
        const { data: existingProfile, error: checkProfileError } =
          await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

        if (checkProfileError && checkProfileError.code !== "PGRST116") {
          // PGRST116 means no rows returned, which is expected if profile doesn't exist
          console.error("Error checking profile:", checkProfileError);
          toast.error("Failed to check existing profile");
          return;
        }

        if (!existingProfile) {
          // Create profile entry only if it doesn't exist
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              full_name: username,
              phone_number: formattedPhoneNumber,
              role: "renter",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar_url: null,
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
            toast.error("Failed to create profile");
            return;
          }
        } else {
          // Update existing profile
          const updateData: ExtendedProfile & { updated_at: string } = {
            full_name: username,
            phone_number: formattedPhoneNumber,
            updated_at: new Date().toISOString(),
          };

          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", data.user.id);

          if (profileUpdateError) {
            console.error("Profile update error:", profileUpdateError);
            toast.error("Failed to update profile");
            return;
          }
        }

        // Update user metadata
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            unverified_phone: formattedPhoneNumber,
            display_name: username,
          },
        });

        if (updateError) {
          console.error("Metadata update error:", updateError);
          toast.error("Failed to update user metadata");
          return;
        }

        toast.success("Account created successfully!");

        // Track user registration and guest session end for analytics
        trackUserRegistered();
        trackGuestSessionEndOnRegistration();

        // Check for post-auth intent and redirect accordingly
        const postAuthIntent = sessionStorage.getItem("postAuthIntent");
        if (postAuthIntent) {
          try {
            const { page } = JSON.parse(postAuthIntent);
            if (page) {
              sessionStorage.removeItem("postAuthIntent");
              navigate(page);
              return;
            }
          } catch (e) {
            // Fallback to login if parsing fails
            sessionStorage.removeItem("postAuthIntent");
          }
        }
        navigate("/login");
=======
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/login");
        }
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              placeholder="Enter your full name"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleFormStart();
              }}
=======
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleFormStart();
              }}
=======
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
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
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(formatPhoneNumber(e.target.value));
                  handleFormStart();
                }}
=======
                onChange={(e) =>
                  setPhoneNumber(formatPhoneNumber(e.target.value))
                }
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                handleFormStart();
              }}
=======
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                handleFormStart();
              }}
=======
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showConfirmPassword ? "Hide password" : "Show password"}
              </span>
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !email || !password || !username || !phoneNumber || !confirmPassword}
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
};
