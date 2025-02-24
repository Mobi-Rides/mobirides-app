
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Common country codes with flags
const countryCodes = [
  { code: "+1", country: "US 🇺🇸" },
  { code: "+44", country: "UK 🇬🇧" },
  { code: "+91", country: "IN 🇮🇳" },
  { code: "+61", country: "AU 🇦🇺" },
  { code: "+86", country: "CN 🇨🇳" },
  { code: "+33", country: "FR 🇫🇷" },
  { code: "+49", country: "DE 🇩🇪" },
  { code: "+81", country: "JP 🇯🇵" },
  { code: "+52", country: "MX 🇲🇽" },
  { code: "+55", country: "BR 🇧🇷" },
];

export const SignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (user) {
        // Create profile with additional fields including formatted phone number
        const formattedPhoneNumber = `${countryCode}${phoneNumber}`;
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: username,
            phone_number: formattedPhoneNumber,
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter your username"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter your email"
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={setCountryCode}
            disabled={loading}
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
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter phone number"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="Create a password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Account..." : "Sign Up"}
      </Button>
    </form>
  );
};
