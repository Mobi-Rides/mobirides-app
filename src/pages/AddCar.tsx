import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{
    registration?: File;
    insurance?: File;
    additional?: FileList;
  }>({});
  const [userId, setUserId] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">List Your Car</h1>
        
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
          
          <DocumentUpload onDocumentChange={handleDocumentChange} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding Car..." : "Add Car"}
          </Button>
        </form>
      </div>
      <Navigation />
    </div>
  );
};

export default AddCar;