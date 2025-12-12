
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { CarForm } from "@/components/add-car/CarForm";
import type { CarFormData } from "@/types/location";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

import { HostAvailabilityCalendar } from "@/components/host/HostAvailabilityCalendar";
import { Separator } from "@/components/ui/separator";

const EditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    seats: 0,
    description: "",
    latitude: 0,
    longitude: 0,
    features: [],
  };

  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (car) {
      setSelectedFeatures(car.features || []);
    }
  }, [car]);

  const handleSubmit = async (formData: CarFormData, imageFiles: File[]) => {
    setIsSubmitting(true);

    try {
      // Note: Image management is now handled by CarImageManager component
      // This submit only updates the car details
      const { error } = await supabase
        .from("cars")
        .update({
          price_per_day: parseFloat(formData.price_per_day),
          year: parseInt(formData.year.toString()),
          seats: parseInt(formData.seats.toString()),
          brand: formData.brand,
          model: formData.model,
          vehicle_type: formData.vehicle_type,
          location: formData.location,
          transmission: formData.transmission,
          fuel: formData.fuel,
          description: formData.description,
          features: selectedFeatures,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your car has been updated successfully!",
      });

      navigate(`/cars/${id}`);
    } catch (error) {
      console.error("Error updating car:", error);
      toast({
        title: "Error",
        description: "Failed to update your car. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  const formData = car ? {
    brand: car.brand,
    model: car.model,
    year: car.year,
    vehicle_type: car.vehicle_type,
    price_per_day: car.price_per_day.toString(),
    location: car.location,
    transmission: car.transmission,
    fuel: car.fuel,
    seats: car.seats,
    description: car.description || "",
    latitude: car.latitude || 0,
    longitude: car.longitude || 0,
    features: car.features || [],
  } : initialFormData;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Edit Car</h1>
        </div>
        
        <CarForm
          initialData={formData}
          selectedFeatures={selectedFeatures}
          onFeaturesChange={setSelectedFeatures}
          isEdit={true}
          carId={id}
          mainImageUrl={car?.image_url}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        {id && (
          <div className="mt-8 space-y-6">
            <Separator />
            <div>
              <h2 className="text-xl font-semibold mb-4">Availability Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Tap dates to block or unblock them. Blocked dates will not be available for booking.
              </p>
              <HostAvailabilityCalendar carId={id} />
            </div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
};

export default EditCar;
