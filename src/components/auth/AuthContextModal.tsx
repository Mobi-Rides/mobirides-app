
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

interface AuthContextModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export const AuthContextModal: React.FC<AuthContextModalProps> = ({
  isOpen,
  onOpenChange,
  title = "Sign in to continue",
  description = "You need to be signed in to access this feature.",
  onSuccess,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {mode === "signin" ? (
            <>
              <SignInForm onSuccess={handleSuccess} />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </Button>
                </p>
              </div>
            </>
          ) : (
            <>
              <SignUpForm onSuccess={handleSuccess} />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </Button>
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
