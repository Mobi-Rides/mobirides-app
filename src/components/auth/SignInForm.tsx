import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TouchTarget } from "@/components/ui/TouchTarget";

interface SignInFormProps {
  onSuccess?: () => void;
  idPrefix?: string;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess, idPrefix = "signin" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (!email.trim() || !isValidEmail(email)) {
      setError("Please enter a valid email address");
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      setTouched(prev => ({ ...prev, password: true }));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.");
        } else {
          setError(error.message);
        }
        return;
      }

      // Wait for session to be established
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Failed to establish session. Please try again.");
        return;
      }

      toast.success("Signed in successfully!");
      navigate("/");
      onSuccess?.();
    } catch (error) {
      console.error("SignInForm: Unexpected error", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const showEmailError = touched.email && email && !isValidEmail(email);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-label="Sign in form"
      noValidate
    >
      {error && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="polite"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="text-base">
          Email
        </Label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
          placeholder="Enter your email"
          required
          disabled={isLoading}
          aria-required="true"
          aria-invalid={showEmailError || !!error}
          aria-describedby={showEmailError ? `${idPrefix}-email-error` : undefined}
          className="h-12"
        />
        {showEmailError && (
          <p
            id={`${idPrefix}-email-error`}
            className="text-sm text-destructive mt-1"
            role="alert"
          >
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`} className="text-base">
          Password
        </Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-password`}
            type={showPassword ? "text" : "password"}
            inputMode="text"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            placeholder="Enter your password"
            className="pr-12 h-12"
            required
            disabled={isLoading}
            aria-required="true"
            aria-invalid={touched.password && !password}
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
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-medium touch-manipulation"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Forgot Password Link */}
      <div className="text-center pt-2">
        <a
          href="/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          aria-label="Forgot your password? Click to reset"
        >
          Forgot your password?
        </a>
      </div>
    </form>
  );
};

export default SignInForm;
