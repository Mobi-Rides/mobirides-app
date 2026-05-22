
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AuthLandingShell } from "@/components/auth/AuthLandingShell";

const Signup = () => {
  return (
    <AuthLandingShell
      eyebrow="Create your account"
      title="Start with MobiRides"
      description="Join as a renter or host, complete your profile, and move through bookings with secure verification."
      mode="signup"
      footerText="Already have an account?"
      footerActionLabel="Sign in"
      footerActionTo="/login"
    >
      <SignUpForm />
    </AuthLandingShell>
  );
};

export default Signup;
