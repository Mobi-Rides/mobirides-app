import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/add-car/ImageUpload";

interface DriverLicenseForm {
  license_number: string;
  country_of_issue: string;
  expiry_date: string;
  date_of_birth: string;
  phone_number: string;
}

const DriverLicense = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<DriverLicenseForm>({
    defaultValues: {
      license_number: "",
      country_of_issue: "",
      expiry_date: "",
      date_of_birth: "",
      phone_number: "",
    },
  });

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // For development, skip license check and redirect to home
      navigate("/");
      
      // Uncomment when ready to enforce license verification
      /*
      const { data: license } = await supabase
        .from("driver_licenses")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (license) {
        navigate("/");
      }
      */
    } catch (error) {
      console.error("Error checking license status:", error);
    }
  };

  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFrontImage(e.target.files[0]);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackImage(e.target.files[0]);
    }
  };

  const onSubmit = async (values: DriverLicenseForm) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upload images
      const frontImagePath = `${user.id}/license-front`;
      const backImagePath = `${user.id}/license-back`;

      if (frontImage) {
        const { error: frontError } = await supabase.storage
          .from("licenses")
          .upload(frontImagePath, frontImage);
        if (frontError) throw frontError;
      }

      if (backImage) {
        const { error: backError } = await supabase.storage
          .from("licenses")
          .upload(backImagePath, backImage);
        if (backError) throw backError;
      }

      // Save license information
      const { error } = await supabase.from("driver_licenses").insert({
        user_id: user.id,
        ...values,
        front_image_url: frontImagePath,
        back_image_url: backImagePath,
        verified: false,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver license information submitted successfully",
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting license:", error);
      toast({
        title: "Error",
        description: "Failed to submit driver license information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Driver License Information</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="license_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country_of_issue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country of Issue</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div>
              <FormLabel>Front of License</FormLabel>
              <ImageUpload onImageChange={handleFrontImageChange} />
            </div>

            <div>
              <FormLabel>Back of License</FormLabel>
              <ImageUpload onImageChange={handleBackImageChange} />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default DriverLicense;