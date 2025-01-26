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

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files) {
      if (type === 'additional') {
        setDocuments(prev => ({ ...prev, [type]: e.target.files }));
      } else {
        setDocuments(prev => ({ ...prev, [type]: e.target.files[0] }));
      }
    }
  };

  const uploadDocument = async (file: File, path: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("car-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return supabase.storage
      .from("car-documents")
      .getPublicUrl(filePath).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      let registration_url = null;
      let insurance_url = null;
      let additional_urls: string[] = [];

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

      // Upload registration document
      if (documents.registration) {
        registration_url = await uploadDocument(documents.registration, 'registration');
      }

      // Upload insurance document
      if (documents.insurance) {
        insurance_url = await uploadDocument(documents.insurance, 'insurance');
      }

      // Upload additional documents
      if (documents.additional) {
        for (let i = 0; i < documents.additional.length; i++) {
          const url = await uploadDocument(documents.additional[i], 'additional');
          additional_urls.push(url);
        }
      }

      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { error } = await supabase.from("cars").insert({
        owner_id: userId,
        image_url,
        registration_url,
        insurance_url,
        additional_docs_urls: additional_urls,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
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
      });

      if (error) throw error;

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