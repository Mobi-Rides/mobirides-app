
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CarBasicInfo } from "@/components/add-car/CarBasicInfo";
import { CarDetails } from "@/components/add-car/CarDetails";
import { CarDescription } from "@/components/add-car/CarDescription";
import { ImageUpload } from "@/components/add-car/ImageUpload";
import { DocumentUpload } from "@/components/add-car/DocumentUpload";
import { CarFeatures } from "@/components/add-car/CarFeatures";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

interface CarFormData {
  brand: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  price_per_day: string;
  location: string;
  transmission: string;
  fuel: string;
  seats: string;
  description: string;
}

interface CarFormProps {
  initialData: CarFormData;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  isEdit?: boolean;
  carId?: string;
  onSubmit: (formData: CarFormData, imageFile: File | null, documents: any, features: string[]) => Promise<void>;
  isSubmitting: boolean;
}

export const CarForm = ({
  initialData,
  selectedFeatures,
  onFeaturesChange,
  isEdit = false,
  onSubmit,
  isSubmitting
}: CarFormProps) => {
  const [formData, setFormData] = useState<CarFormData>(initialData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{
    registration?: File;
    insurance?: File;
    additional?: FileList;
  }>({});

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
    await onSubmit(formData, imageFile, documents, selectedFeatures);
  };

  return (
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
      
      <CarFeatures
        selectedFeatures={selectedFeatures}
        onChange={onFeaturesChange}
      />

      <CarDescription
        description={formData.description}
        onChange={handleInputChange}
      />

      <ImageUpload onImageChange={handleImageChange} />
      
      {!isEdit && (
        <DocumentUpload onDocumentChange={handleDocumentChange} />
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (isEdit ? "Updating Car..." : "Adding Car...") : (isEdit ? "Update Car" : "Add Car")}
      </Button>
    </form>
  );
};
