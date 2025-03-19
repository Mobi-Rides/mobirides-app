
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { CarForm } from "@/components/add-car/CarForm";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const initialFormData = {
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vehicle_type: "" as VehicleType,
    price_per_day: "",
    location: "",
    transmission: "",
    fuel: "",
    seats: "",
    description: "",
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
    };
    checkUser();
  }, [navigate]);

  const uploadDocument = async (file: File, path: string): Promise<string | null> => {
    console.log(`Attempting to upload document to ${path}`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("car-documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading document:", uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("car-documents")
        .getPublicUrl(filePath);

      console.log(`Document uploaded successfully to ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error("Error in uploadDocument:", error);
      return null;
    }
  };

  const handleSubmit = async (formData: any, imageFile: File | null, documents: any, features: string[]) => {
    console.log("Starting car submission process...");
    
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to add a car",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let image_url = null;

      // Upload main car image if provided
      if (imageFile) {
        console.log("Uploading main car image...");
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Error uploading car image:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(filePath);

        image_url = publicUrl;
        console.log("Car image uploaded successfully:", image_url);
      }

      console.log("Inserting car data into database...");
      const { error: insertError } = await supabase.from("cars").insert({
        owner_id: userId,
        image_url,
        price_per_day: parseFloat(formData.price_per_day),
        year: parseInt(formData.year.toString()),
        seats: parseInt(formData.seats),
        brand: formData.brand,
        model: formData.model,
        vehicle_type: formData.vehicle_type,
        location: formData.location,
        transmission: formData.transmission,
        fuel: formData.fuel,
        description: formData.description,
        features: features,
        is_available: true,
      });

      if (insertError) {
        console.error("Error inserting car data:", insertError);
        throw insertError;
      }

      console.log("Car listed successfully!");
      toast({
        title: "Success",
        description: "Your car has been listed successfully!",
      });

      navigate("/");
    } catch (error) {
      console.error("Error adding car:", error);
      toast({
        title: "Error",
        description: "Failed to add your car. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">List Your Car</h1>
        </div>
        
        <CarForm
          initialData={initialFormData}
          selectedFeatures={selectedFeatures}
          onFeaturesChange={setSelectedFeatures}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
      <Navigation />
    </div>
  );
};

export default AddCar;
