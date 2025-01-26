import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log("Active session found, redirecting to home");
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Mobirides
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to start sharing or renting cars
          </p>
        </div>
        
        <div className="mt-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;