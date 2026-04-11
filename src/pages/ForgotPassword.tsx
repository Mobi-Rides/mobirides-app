import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSending(true);
    setError("");

    console.log('[ForgotPassword] Sending request to /api/auth/forgot-password for:', email);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('[ForgotPassword] Response status:', response.status);

      let result;
      try {
        result = await response.json();
        console.log('[ForgotPassword] Response data:', result);
      } catch (parseError) {
        console.error('[ForgotPassword] Error parsing response:', parseError);
        setError('Server returned an invalid response. Please try again.');
        return;
      }

      if (!response.ok) {
        console.error('[ForgotPassword] Request failed:', result);
        setError(result.error || result.details || `Server error (${response.status}): Failed to send reset email`);
        return;
      }

      toast.success("Password reset email sent! Check your inbox for instructions.");
      navigate("/password-reset-sent");
    } catch (error) {
      console.error('[ForgotPassword] Network or fetch error:', error);
      console.error('[ForgotPassword] Error details:', error instanceof Error ? error.message : 'Unknown error');

      // Provide more specific error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError("Cannot connect to server. Please ensure the API server is running (npm run api) and try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src="/lovable-uploads/MOBI_LOGO.png"
            alt="Mobirides Logo"
            className="mx-auto h-48 w-48"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot Password
          </h2>
        </div>
        <div className="mt-8 p-6 bg-white rounded shadow">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <Button onClick={handleForgotPassword} disabled={isSending} className="w-full">
            {isSending ? "Sending..." : "Send Reset Email"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
