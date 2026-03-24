import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PasswordResetSent: React.FC = () => {
  const navigate = useNavigate();

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
            Check Your Email
          </h2>
        </div>
        <div className="mt-8 bg-white p-6 rounded shadow text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            If you don't see the email, check your spam folder or try again.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate("/?auth=signin")} className="w-full">
              Back to Login
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/forgot-password")}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetSent;
