import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingView } from "@/components/home/LoadingView";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    const completeOAuthSignIn = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session) {
          setMessage("Waiting for your sign-in session...");
          window.setTimeout(() => navigate("/login", { replace: true }), 1200);
          return;
        }

        navigate("/login", { replace: true });
      } catch (error) {
        console.error("OAuth callback error:", error);
        setMessage("Sign-in failed. Redirecting you back to login...");
        window.setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    };

    void completeOAuthSignIn();
  }, [navigate]);

  return <LoadingView message={message} />;
};

export default AuthCallback;
