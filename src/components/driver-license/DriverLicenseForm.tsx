import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "./ImageUpload";

interface DriverLicenseFormValues {
  license_number: string;
  country_of_issue: string;
  expiry_date: string;
  date_of_birth: string;
  phone_number: string;
}

export const DriverLicenseForm = () => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<DriverLicenseFormValues>({
    defaultValues: {
      license_number: "",
      country_of_issue: "",
      expiry_date: "",
      date_of_birth: "",
      phone_number: "",
    },
  });

  const onSubmit = async (values: DriverLicenseFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting driver license form", values);

      if (!frontImage || !backImage) {
        toast({
          title: "Error",
          description: "Please upload both front and back images of your license",
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upload front image
      const frontImagePath = `${user.id}/license-front.${frontImage.name.split(".").pop()}`;
      const { error: frontUploadError } = await supabase.storage
        .from("licenses")
        .upload(frontImagePath, frontImage);
      if (frontUploadError) throw frontUploadError;

      // Upload back image
      const backImagePath = `${user.id}/license-back.${backImage.name.split(".").pop()}`;
      const { error: backUploadError } = await supabase.storage
        .from("licenses")
        .upload(backImagePath, backImage);
      if (backUploadError) throw backUploadError;

      // Save license information
      const { error: insertError } = await supabase.from("driver_licenses").insert({
        user_id: user.id,
        license_number: values.license_number,
        country_of_issue: values.country_of_issue,
        expiry_date: values.expiry_date,
        date_of_birth: values.date_of_birth,
        phone_number: values.phone_number,
        front_image_url: frontImagePath,
        back_image_url: backImagePath,
      });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Driver license information saved successfully",
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting driver license:", error);
      toast({
        title: "Error",
        description: "Failed to save driver license information",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUpload
            label="Front of License"
            onChange={(file) => setFrontImage(file)}
          />
          <ImageUpload
            label="Back of License"
            onChange={(file) => setBackImage(file)}
          />
        </div>

        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter license number" {...field} />
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
                <Input placeholder="Enter country of issue" {...field} />
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
                <Input placeholder="Enter phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save License Information"}
        </Button>
      </form>
    </Form>
  );
};