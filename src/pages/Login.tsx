import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
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
      const from = location.state?.from?.pathname || "/";
      navigate(from);
    }
  };

  const loginWithTestAccount = async (email: string, password: string) => {
    try {
      console.log('Login attempt started for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        toast.error("Invalid email or password. Please try again.");
        return;
      }

      if (data.user) {
        console.log('Login successful for:', data.user.email);
        toast.success(`Welcome back!`);
        
        const from = location.state?.from?.pathname || "/";
        navigate(from);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use the test accounts below or create a new account
          </p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => loginWithTestAccount("host@example.com", "testhost123")}
          >
            Test Host Account
          </Button>
          <Button
            variant="outline"
            onClick={() => loginWithTestAccount("renter@example.com", "testrenter123")}
          >
            Test Renter Account
          </Button>
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