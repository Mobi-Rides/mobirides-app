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

  const loginWithTestAccount = async (email: string, password: string) => {
    try {
      console.log('Attempting to login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login error details:', error);
        throw error;
      }
      
      if (data.user) {
        console.log('Login successful:', data.user.email);
        toast.success("Logged in successfully");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login with test account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
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