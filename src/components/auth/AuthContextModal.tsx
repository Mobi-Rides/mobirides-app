import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";

interface AuthContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    action: 'booking' | 'save_car' | 'contact_host';
    title?: string;
    description?: string;
  };
  defaultTab?: "signin" | "signup";
}

const getContextContent = (action?: string) => {
  switch (action) {
    case 'booking':
      return {
        title: 'Sign up to book this car',
        description: 'Create an account to complete your booking and connect with the host.'
      };
    case 'save_car':
      return {
        title: 'Sign up to save cars',
        description: 'Create an account to save your favorite cars and access them anytime.'
      };
    case 'contact_host':
      return {
        title: 'Sign up to contact host',
        description: 'Create an account to message the host and ask questions about the car.'
      };
    default:
      return {
        title: 'Join Mobirides',
        description: 'Sign up to access all features and start your car rental journey.'
      };
  }
};

export const AuthContextModal = ({ 
  isOpen, 
  onClose, 
  context,
  defaultTab = "signup" 
}: AuthContextModalProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const navigate = useNavigate();
  const location = useLocation();

  const contextContent = getContextContent(context?.action);

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

  const handleSuccess = () => {
    onClose();
    // The auth state change will trigger pending action execution
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {context?.title || contextContent.title}
          </DialogTitle>
          {(context?.description || contextContent.description) && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {context?.description || contextContent.description}
            </p>
          )}
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
            <SignInForm onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="signup" className="mt-4">
            <SignUpForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};