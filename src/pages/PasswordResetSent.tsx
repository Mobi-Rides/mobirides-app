import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PasswordResetSent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Check Your Email</h1>
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
  );
};

export default PasswordResetSent;
