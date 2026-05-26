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
import { Eye, EyeOff, Loader2, CheckCircle, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import countryCodes from "@/constants/Countries";
import { TouchTarget } from "@/components/ui/TouchTarget";
import { cn } from "@/lib/utils";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { SignUpConsents, ConsentState, allRequiredConsentsChecked } from "@/components/auth/SignUpConsents";
import { signInWithSocialProvider, type SocialOAuthProvider } from "@/services/oauthAuth";

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
  const [socialLoading, setSocialLoading] = useState<SocialOAuthProvider | null>(null);
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

  const authInProgress = isLoading || socialLoading !== null;
  const canSubmit = allRequiredConsentsChecked(consents) && !authInProgress;

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
        description: 'You can now sign in with your credentials. Welcome to MobiRides!'
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

  const handleSocialSignIn = async (provider: SocialOAuthProvider) => {
    setSocialLoading(provider);
    setError("");

    try {
      await signInWithSocialProvider(provider);
    } catch (error) {
      console.error(`SignUpForm: ${provider} sign-in failed`, error);
      setError(
        error instanceof Error
          ? error.message
          : "Social sign-in failed. Please try again."
      );
      toast.error("Social sign-in failed. Please try again.");
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-label="Sign up form"
      noValidate
    >
      {error && (
        <Alert variant="destructive" role="alert" aria-live="polite" className="rounded-xl">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Full Name Field */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-full-name" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Full Name
        </Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
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
            disabled={authInProgress}
            aria-required="true"
            aria-invalid={touched.fullName && !fullName.trim()}
            className="pl-11 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
          />
        </div>
      </div>

      {/* Email Field */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
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
            disabled={authInProgress}
            aria-required="true"
            aria-invalid={showEmailError}
            aria-describedby={showEmailError ? "signup-email-error" : undefined}
            className="pl-11 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
          />
        </div>
        {showEmailError && (
          <p id="signup-email-error" className="text-xs font-semibold text-destructive mt-1" role="alert">
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Phone Number Field */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-phone" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Phone Number
        </Label>
        <div className="flex gap-2">
          <Select
            value={countryCode}
            onValueChange={setCountryCode}
            disabled={authInProgress}
          >
            <SelectTrigger
              className="w-[110px] h-12 rounded-xl border-neutral-200 focus:ring-purple-500 bg-white"
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
          <div className="relative flex-1">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
            <Input
              id="signup-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(formatPhoneNumber(e.target.value)); clearError(); }}
              onBlur={() => setTouched(prev => ({ ...prev, phoneNumber: true }))}
              placeholder="Enter phone number"
              className="pl-11 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
              required
              disabled={authInProgress}
              aria-required="true"
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? "signup-phone-error" : undefined}
            />
          </div>
        </div>
        {showPhoneError && (
          <p id="signup-phone-error" className="text-xs font-semibold text-destructive mt-1" role="alert">
            Please enter a valid phone number
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            inputMode="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            placeholder="Create a password"
            className="pl-11 pr-12 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
            required
            disabled={authInProgress}
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
              className="h-10 w-10 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              onClick={() => setShowPassword(!showPassword)}
              disabled={authInProgress}
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
          <p id="signup-password-error" className="text-xs font-semibold text-destructive mt-1" role="alert">
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
            <span className="text-[10px] font-bold text-neutral-500">
              {password.length >= 8 ? "Strong" : password.length >= 6 ? "Good" : "Weak"}
            </span>
          </div>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="signup-confirm-password" className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
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
              "pl-11 pr-12 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white",
              confirmPassword && passwordsMatch && "border-green-500 focus-visible:ring-green-500"
            )}
            required
            disabled={authInProgress}
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
              className="h-10 w-10 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={authInProgress}
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
            <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
          )}
        </div>
        {showConfirmPasswordError && (
          <p className="text-xs font-semibold text-destructive mt-1" role="alert">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Consent Checkboxes */}
      <SignUpConsents consents={consents} onChange={setConsents} />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 border-none transition-all duration-300 group touch-manipulation"
        disabled={!canSubmit}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Creating account...</span>
          </>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            Sign Up
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        )}
      </Button>

      {/* Social Logins */}
      <div className="pt-2">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200/80" />
          </div>
          <div className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
            Or continue with
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2"
            onClick={() => handleSocialSignIn("google")}
            disabled={authInProgress}
            aria-busy={socialLoading === "google"}
          >
            {socialLoading === "google" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-xs font-bold text-neutral-600">Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2"
            onClick={() => handleSocialSignIn("facebook")}
            disabled={authInProgress}
            aria-busy={socialLoading === "facebook"}
          >
            {socialLoading === "facebook" ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            <span className="text-xs font-bold text-neutral-600">Facebook</span>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
