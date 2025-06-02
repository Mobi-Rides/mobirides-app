
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";

export const UnauthenticatedView = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const location = useLocation();
  const navigate = useNavigate();

  // Check URL for auth parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authParam = params.get("auth");
    
    if (authParam === "signin" || authParam === "signup") {
      setDefaultTab(authParam);
      setIsAuthModalOpen(true);
    }
  }, [location.search]);

  const handleSignInClick = () => {
    setDefaultTab("signin");
    setIsAuthModalOpen(true);
    navigate("/?auth=signin", { replace: true });
  };

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-center max-w-md mx-auto">
      <div className="p-8 rounded-lg">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-600">
          Welcome to Mobirides{" "}
        </h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to browse our collection of cars for rent, save
          your favorites, and book your next ride!
        </p>

        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl border-primary md:size-auto md:px-4 md:py-2 md:flex md:items-center md:gap-2 mx-auto"
          onClick={handleSignInClick}
        >
          <LogIn className="h-4 w-4 text-primary" />
          <span className="hidden md:inline-block">
            <p className="text-primary text-xs md:text-sm lg:text-base font-semibold">
              Sign in
            </p>
          </span>
        </Button>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleCloseModal} 
        defaultTab={defaultTab} 
      />
    </div>
  );
};
