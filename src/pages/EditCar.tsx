import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { CarBasicInfo } from "@/components/add-car/CarBasicInfo";
import { CarDetails } from "@/components/add-car/CarDetails";
import { CarDescription } from "@/components/add-car/CarDescription";
import { ImageUpload } from "@/components/add-car/ImageUpload";
import { DocumentUpload } from "@/components/add-car/DocumentUpload";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

const EditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{
    registration?: File;
    insurance?: File;
    additional?: FileList;
  }>({});

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

  const [formData, setFormData] = useState({
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
  });

  useEffect(() => {
    if (car) {
      setFormData({
        brand: car.brand,
        model: car.model,
        year: car.year,
        vehicle_type: car.vehicle_type,
        price_per_day: car.price_per_day.toString(),
        location: car.location,
        transmission: car.transmission,
        fuel: car.fuel,
        seats: car.seats.toString(),
        description: car.description || "",
      });
    }
  }, [car]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'vehicle_type') {
      setFormData((prev) => ({ ...prev, [name]: value as VehicleType }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files) {
      if (type === 'additional') {
        setDocuments(prev => ({ ...prev, [type]: e.target.files }));
      } else {
        setDocuments(prev => ({ ...prev, [type]: e.target.files[0] }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let image_url = car?.image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(filePath);

        image_url = publicUrl;
      }

      const { error } = await supabase
        .from("cars")
        .update({
          image_url,
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">Edit Car</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <CarBasicInfo 
            formData={formData}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />

          <CarDetails
            formData={formData}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
          />

          <CarDescription
            description={formData.description}
            onChange={handleInputChange}
          />

          <ImageUpload onImageChange={handleImageChange} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating Car..." : "Update Car"}
          </Button>
        </form>
      </div>
      <Navigation />
    </div>
  );
};

export default EditCar;