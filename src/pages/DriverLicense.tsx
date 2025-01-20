import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DriverLicenseForm } from "@/components/driver-license/DriverLicenseForm";
import { useQuery } from "@tanstack/react-query";

const DriverLicense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: hasLicense } = useQuery({
    queryKey: ["driver-license"],
    queryFn: async () => {
      console.log("Checking driver license status");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("driver_licenses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("Has license:", !!data);
      return !!data;
    },
  });

  useEffect(() => {
    if (hasLicense) {
      console.log("User already has license, redirecting");
      navigate("/");
    }
  }, [hasLicense, navigate]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Driver License Information</h1>
      <p className="text-gray-600 mb-8">
        Please provide your driver license information to continue using the platform.
      </p>
      <DriverLicenseForm />
    </div>
  );
};

export default DriverLicense;