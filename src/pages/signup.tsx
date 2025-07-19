
import { useNavigate } from "react-router-dom";
import { SignUpForm } from "@/components/auth/SignUpForm";

const Signup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/lovable-uploads/a065be26-80b7-4e50-b683-b6afb0add925.png"
            alt="Mobirides Logo"
            className="mx-auto h-48 w-48"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to <span className="text-[#7C3AED]">Mobirides</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create an account to start sharing or renting cars
          </p>
        </div>
        <SignUpForm />
        <div className="mt-8">
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#7C3AED] hover:text-[#6D28D9]"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
