
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    console.log("Login: Checking session");
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === "SIGNED_IN" && session) {
        console.log("User signed in, redirecting to home");
        const from = location.state?.from?.pathname || "/";
        navigate(from);
      }

      if (event === "SIGNED_OUT") {
        console.log("User signed out");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        toast.error("There was an error checking your session");
        return;
      }

      if (session) {
        console.log("Active session found, redirecting to home");
        const from = location.state?.from?.pathname || "/";
        navigate(from);
      }
    } catch (error) {
      console.error("Error in checkSession:", error);
      toast.error("There was an error checking your session");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img
            src="/lovable-uploads/5f01f258-2bf0-42c9-a69a-83350aa11d7f.png"
            alt="Mobirides Logo"
            className="mx-auto h-48 w-48"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to <span className="text-[#7C3AED]">Mobirides</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? "Create an account to start sharing or renting cars" : "Sign in to start sharing or renting cars"}
          </p>
        </div>
        
        <div className="mt-8">
          {isSignUp ? (
            <>
              <SignUpForm />
              <p className="mt-4 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Sign in
                </button>
              </p>
            </>
          ) : (
            <>
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#7C3AED',
                        brandAccent: '#6D28D9',
                      },
                    },
                  },
                }}
                theme="light"
                providers={[]}
                localization={{
                  variables: {
                    sign_up: {
                      link_text: "",
                      // This removes the "Don't have an account? Sign up" text under "Forgot your password"
                    }
                  }
                }}
              />
              <p className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
