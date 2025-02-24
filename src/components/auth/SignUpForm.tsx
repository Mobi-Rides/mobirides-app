
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

// Common country codes with flags including African countries
const countryCodes = [
  // African Countries
  { code: "+213", country: "DZ 🇩🇿" }, // Algeria
  { code: "+244", country: "AO 🇦🇴" }, // Angola
  { code: "+267", country: "BW 🇧🇼" }, // Botswana
  { code: "+226", country: "BF 🇧🇫" }, // Burkina Faso
  { code: "+257", country: "BI 🇧🇮" }, // Burundi
  { code: "+237", country: "CM 🇨🇲" }, // Cameroon
  { code: "+238", country: "CV 🇨🇻" }, // Cape Verde
  { code: "+236", country: "CF 🇨🇫" }, // Central African Republic
  { code: "+235", country: "TD 🇹🇩" }, // Chad
  { code: "+269", country: "KM 🇰🇲" }, // Comoros
  { code: "+242", country: "CG 🇨🇬" }, // Congo
  { code: "+243", country: "CD 🇨🇩" }, // DR Congo
  { code: "+253", country: "DJ 🇩🇯" }, // Djibouti
  { code: "+20", country: "EG 🇪🇬" },  // Egypt
  { code: "+240", country: "GQ 🇬🇶" }, // Equatorial Guinea
  { code: "+291", country: "ER 🇪🇷" }, // Eritrea
  { code: "+251", country: "ET 🇪🇹" }, // Ethiopia
  { code: "+241", country: "GA 🇬🇦" }, // Gabon
  { code: "+220", country: "GM 🇬🇲" }, // Gambia
  { code: "+233", country: "GH 🇬🇭" }, // Ghana
  { code: "+224", country: "GN 🇬🇳" }, // Guinea
  { code: "+245", country: "GW 🇬🇼" }, // Guinea-Bissau
  { code: "+254", country: "KE 🇰🇪" }, // Kenya
  { code: "+266", country: "LS 🇱🇸" }, // Lesotho
  { code: "+231", country: "LR 🇱🇷" }, // Liberia
  { code: "+218", country: "LY 🇱🇾" }, // Libya
  { code: "+261", country: "MG 🇲🇬" }, // Madagascar
  { code: "+265", country: "MW 🇲🇼" }, // Malawi
  { code: "+223", country: "ML 🇲🇱" }, // Mali
  { code: "+222", country: "MR 🇲🇷" }, // Mauritania
  { code: "+230", country: "MU 🇲🇺" }, // Mauritius
  { code: "+212", country: "MA 🇲🇦" }, // Morocco
  { code: "+258", country: "MZ 🇲🇿" }, // Mozambique
  { code: "+264", country: "NA 🇳🇦" }, // Namibia
  { code: "+227", country: "NE 🇳🇪" }, // Niger
  { code: "+234", country: "NG 🇳🇬" }, // Nigeria
  { code: "+250", country: "RW 🇷🇼" }, // Rwanda
  { code: "+239", country: "ST 🇸🇹" }, // São Tomé and Príncipe
  { code: "+221", country: "SN 🇸🇳" }, // Senegal
  { code: "+232", country: "SL 🇸🇱" }, // Sierra Leone
  { code: "+252", country: "SO 🇸🇴" }, // Somalia
  { code: "+27", country: "ZA 🇿🇦" },  // South Africa
  { code: "+211", country: "SS 🇸🇸" }, // South Sudan
  { code: "+249", country: "SD 🇸🇩" }, // Sudan
  { code: "+268", country: "SZ 🇸🇿" }, // Swaziland
  { code: "+255", country: "TZ 🇹🇿" }, // Tanzania
  { code: "+228", country: "TG 🇹🇬" }, // Togo
  { code: "+216", country: "TN 🇹🇳" }, // Tunisia
  { code: "+256", country: "UG 🇺🇬" }, // Uganda
  { code: "+260", country: "ZM 🇿🇲" }, // Zambia
  { code: "+263", country: "ZW 🇿🇼" }, // Zimbabwe
  // Existing countries
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

  const formatPhoneNumber = (number: string) => {
    // Remove any non-digit characters except plus sign
    const cleaned = number.replace(/[^\d+]/g, '');
    return cleaned;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Format the phone number to E.164 format
      const formattedPhoneNumber = formatPhoneNumber(`${countryCode}${phoneNumber}`);
      console.log("Formatted phone number:", formattedPhoneNumber);

      // First create the user account
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone_number: formattedPhoneNumber,
            display_name: username
          }
        }
      });

      if (signUpError) throw signUpError;

      if (user) {
        console.log("User created successfully:", user.id);
        
        // Create profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: username,
            phone_number: formattedPhoneNumber,
            role: 'renter',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: null
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw profileError;
        }

        toast({
          title: "Success",
          description: "Account created successfully!",
        });

        navigate('/');
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
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
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
