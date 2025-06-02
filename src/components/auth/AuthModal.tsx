
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export const AuthModal = ({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const navigate = useNavigate();
  const location = useLocation();

  // Update URL when tab changes
  useEffect(() => {
    if (isOpen) {
      navigate(`/?auth=${activeTab}`, { replace: true });
    }
  }, [activeTab, isOpen, navigate]);

  // Close modal and reset URL when navigating away
  useEffect(() => {
    return () => {
      if (isOpen && location.search.includes("auth=")) {
        navigate("/", { replace: true });
      }
    };
  }, [isOpen, location.search, navigate]);

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      navigate("/", { replace: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to <span className="text-primary">Mobirides</span>
          </DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <SignInForm onSuccess={onClose} />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
