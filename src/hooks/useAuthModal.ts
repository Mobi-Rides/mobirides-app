import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup">("signin");
  const navigate = useNavigate();

  const openSignIn = useCallback(() => {
    setDefaultTab("signin");
    setIsOpen(true);
    navigate("/?auth=signin", { replace: true });
  }, [navigate]);

  const openSignUp = useCallback(() => {
    setDefaultTab("signup");
    setIsOpen(true);
    navigate("/?auth=signup", { replace: true });
  }, [navigate]);

  const close = useCallback(() => {
    setIsOpen(false);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && isOpen) {
        close();
      }
    });

    return () => subscription.unsubscribe();
  }, [close, isOpen]);

  return {
    isOpen,
    defaultTab,
    openSignIn,
    openSignUp,
    close,
    setIsOpen,
  };
};
