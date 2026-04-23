import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import countryCodes from "@/constants/Countries";
import { TouchTarget } from "@/components/ui/TouchTarget";
import { cn } from "@/lib/utils";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { SignUpConsents, ConsentState, allRequiredConsentsChecked } from "@/components/auth/SignUpConsents";

interface SignUpFormProps {
  onSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+267");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
  });
  const [consents, setConsents] = useState<ConsentState>({
    ageConfirmed: false,
    termsAccepted: false,
    privacyAccepted: false,
    communityAccepted: false,
    marketingOptedIn: false,
  });

  const formatPhoneNumber = (number: string) => {
    return number.replace(/[^\d+]/g, "");
  };

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => phone.length >= 7;
  const isValidPassword = (pass: string) => pass.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  // Real-time validation states
  const showEmailError = touched.email && email && !isValidEmail(email);
  const showPhoneError = touched.phoneNumber && phoneNumber && !isValidPhone(phoneNumber);
  const showPasswordError = touched.password && password && !isValidPassword(password);
  const showConfirmPasswordError = touched.confirmPassword && confirmPassword && !passwordsMatch;

  const canSubmit = allRequiredConsentsChecked(consents) && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!fullName.trim()) {
      setError("Please enter your full name");
      setTouched(prev => ({ ...prev, fullName: true }));
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }

    if (!phoneNumber.trim() || !isValidPhone(phoneNumber)) {
      setError("Please enter a valid phone number");
      setTouched(prev => ({ ...prev, phoneNumber: true }));
      return;
    }

    if (!allRequiredConsentsChecked(consents)) {
      setError("Please accept all required agreements to continue");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setTouched(prev => ({ ...prev, confirmPassword: true }));
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setTouched(prev => ({ ...prev, password: true }));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formattedPhoneNumber = formatPhoneNumber(`${countryCode}${phoneNumber}`);

      const apiBaseUrl = import.meta.env.VITE_FRONTEND_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName.trim(),
          phoneNumber: formattedPhoneNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error("Signup error:", result);

        if (result.error?.includes('already exists') || result.error?.includes('already registered')) {
          if (result.error?.includes('phone number')) {
            setError('An account with this phone number already exists');
          } else {
            setError('An account with this email already exists');
          }
        } else if (result.error?.includes('Password should be at least')) {
          setError('Password should be at least 6 characters long');
        } else if (result.error?.includes('Invalid email')) {
          setError('Please enter a valid email address');
        } else if (result.error?.includes('Full name is required')) {
          setError('Please enter your full name');
        } else {
          setError(result.error || 'Signup failed');
        }
        setIsLoading(false);
        return;
      }

      toast.success('🎉 Account created successfully!', {
        description: result.message || 'Welcome to MobiRides!'
      });

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setPhoneNumber("");
      setCountryCode("+267");
      setTouched({
        fullName: false,
        email: false,
        phoneNumber: false,
        password: false,
        confirmPassword: false,
      });
      setConsents({
        ageConfirmed: false,
        termsAccepted: false,
        privacyAccepted: false,
        communityAccepted: false,
        marketingOptedIn: false,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof Error && (error.message?.includes("network") || error.message?.includes("fetch"))) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label="Sign up form"
      noValidate
    >
      {error && (
        <Alert variant="destructive" role="alert" aria-live="polite">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Full Name Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-full-name" className="text-base">
          Full Name
        </Label>
        <Input
          id="signup-full-name"
          type="text"
          inputMode="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); clearError(); }}
          onBlur={() => setTouched(prev => ({ ...prev, fullName: true }))}
          placeholder="Enter your full name"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={touched.fullName && !fullName.trim()}
          className="h-12"
        />
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-base">
          Email
        </Label>
        <Input
          id="signup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError(); }}
          onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={showEmailError}
          aria-describedby={showEmailError ? "signup-email-error" : undefined}
          className="h-12"
        />
        {showEmailError && (
          <p id="signup-email-error" className="text-sm text-destructive mt-1" role="alert">
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Phone Number Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-phone" className="text-base">
          Phone Number
        </Label>
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={setCountryCode}
            disabled={isLoading}
          >
            <SelectTrigger
              className="w-[120px] h-12"
              aria-label="Select country code"
            >
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
            id="signup-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => { setPhoneNumber(formatPhoneNumber(e.target.value)); clearError(); }}
            onBlur={() => setTouched(prev => ({ ...prev, phoneNumber: true }))}
            placeholder="Enter phone number"
            className="flex-1 h-12"
            required
            disabled={isLoading}
            aria-required="true"
            aria-invalid={showPhoneError}
            aria-describedby={showPhoneError ? "signup-phone-error" : undefined}
          />
        </div>
        {showPhoneError && (
          <p id="signup-phone-error" className="text-sm text-destructive mt-1" role="alert">
            Please enter a valid phone number
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-base">
          Password
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            inputMode="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            placeholder="Create a password"
            className="pr-12 h-12"
            required
            disabled={isLoading}
            aria-required="true"
            aria-invalid={showPasswordError}
            aria-describedby={showPasswordError ? "signup-password-error" : undefined}
          />
          <TouchTarget
            className="absolute right-1 top-1/2 -translate-y-1/2"
            minWidth={44}
            minHeight={44}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </TouchTarget>
        </div>
        {showPasswordError && (
          <p id="signup-password-error" className="text-sm text-destructive mt-1" role="alert">
            Password must be at least 6 characters
          </p>
        )}
        {/* Password strength indicator */}
        {password && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    password.length >= level * 2
                      ? password.length >= 8
                        ? "bg-green-500"
                        : "bg-yellow-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {password.length >= 8 ? "Strong" : password.length >= 6 ? "Good" : "Weak"}
            </span>
          </div>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password" className="text-base">
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            inputMode="text"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
            placeholder="Confirm your password"
            className={cn(
              "pr-12 h-12",
              confirmPassword && passwordsMatch && "border-green-500 focus-visible:ring-green-500"
            )}
            required
            disabled={isLoading}
            aria-required="true"
            aria-invalid={showConfirmPasswordError}
          />
          <TouchTarget
            className="absolute right-1 top-1/2 -translate-y-1/2"
            minWidth={44}
            minHeight={44}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </TouchTarget>
          {confirmPassword && passwordsMatch && (
            <CheckCircle className="absolute right-14 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
          )}
        </div>
        {showConfirmPasswordError && (
          <p className="text-sm text-destructive mt-1" role="alert">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Consent Checkboxes */}
      <SignUpConsents consents={consents} onChange={setConsents} />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-medium touch-manipulation"
        disabled={!canSubmit}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Creating account...</span>
          </>
        ) : (
          "Sign Up"
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
