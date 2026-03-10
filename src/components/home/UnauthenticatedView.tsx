
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";

export const UnauthenticatedView = () => {
  const { isOpen, defaultTab, openSignIn, close } = useAuthModal();
  const location = useLocation();

  // Check URL for auth parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authParam = params.get("auth");

    if (authParam === "signin" || authParam === "signup") {
      if (authParam === "signin") {
        openSignIn();
      }
    }
  }, [location.search, openSignIn]);

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
          variant="default"
          className="rounded-2xl px-8 py-3 flex items-center gap-2 mx-auto text-sm font-semibold"
          onClick={openSignIn}
        >
          <LogIn className="h-4 w-4" />
          Sign In to Continue
        </Button>
      </div>

      <AuthModal
        isOpen={isOpen}
        onClose={close}
        defaultTab={defaultTab}
        idPrefix="home"
      />
    </div>
  );
};
