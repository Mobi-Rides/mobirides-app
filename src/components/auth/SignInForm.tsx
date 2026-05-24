import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
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
          className="rounded-xl"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`} className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Email Address
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
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
            className="pl-11 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
          />
        </div>
        {showEmailError && (
          <p
            id={`${idPrefix}-email-error`}
            className="text-xs font-semibold text-destructive mt-1"
            role="alert"
          >
            Please enter a valid email address
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-password`} className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" aria-hidden="true" />
          <Input
            id={`${idPrefix}-password`}
            type={showPassword ? "text" : "password"}
            inputMode="text"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            placeholder="Enter your password"
            className="pl-11 pr-12 h-12 rounded-xl border-neutral-200 focus-visible:ring-purple-500 bg-white"
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
              className="h-10 w-10 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
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
        className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 border-none transition-all duration-300 group touch-manipulation"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            Sign In
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        )}
      </Button>

      {/* Forgot Password Link */}
      <div className="text-center pt-1">
        <a
          href="/forgot-password"
          className="text-xs font-semibold text-neutral-500 hover:text-purple-700 transition-colors"
          aria-label="Forgot your password? Click to reset"
        >
          Forgot your password?
        </a>
      </div>

      {/* Social Logins */}
      <div className="mt-6 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200/80" />
          </div>
          <div className="relative bg-white px-3 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
            Or continue with
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2"
            onClick={() => toast.info("Google authentication coming soon!")}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span className="text-xs font-bold text-neutral-600">Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center justify-center gap-2"
            onClick={() => toast.info("Facebook authentication coming soon!")}
          >
            <svg className="h-5 w-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-xs font-bold text-neutral-600">Facebook</span>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SignInForm;
