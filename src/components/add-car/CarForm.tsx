
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
import { FormSection } from "@/components/add-car/FormSection";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

interface CarFormData {
  brand: string;
  model: string;
  year: number;
  vehicle_type: VehicleType;
  price_per_day: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  features: string[];
  transmission: string;
  fuel: string;
  seats: number;
}

interface DocumentStructure {
  registration?: File;
  insurance?: File;
  additional?: FileList;
}

interface CarFormProps {
  initialData: CarFormData;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  isEdit?: boolean;
  carId?: string;
  onSubmit: (formData: CarFormData, imageFile: File | null, documents: DocumentStructure, features: string[]) => Promise<void>;
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
  const [documents, setDocuments] = useState<DocumentStructure>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Convert numeric inputs to the right type
    if (name === 'year' || name === 'seats') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection 
        title="Basic Information" 
        description="Enter the fundamental details about your car"
      >
        <CarBasicInfo 
          formData={formData}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
        />
      </FormSection>

      <FormSection 
        title="Vehicle Specifications" 
        description="Provide technical details and pricing information"
      >
        <CarDetails
          formData={formData}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
        />
      </FormSection>
      
      <FormSection 
        title="Features & Amenities" 
        description="Select the features available in your vehicle"
      >
        <CarFeatures
          selectedFeatures={selectedFeatures}
          onChange={onFeaturesChange}
        />
      </FormSection>

      <FormSection 
        title="Vehicle Description" 
        description="Add a detailed description to highlight your vehicle's unique aspects"
      >
        <CarDescription
          description={formData.description}
          onChange={handleInputChange}
        />
      </FormSection>

      <FormSection 
        title="Vehicle Images" 
        description="Upload photos that showcase your vehicle clearly"
      >
        <ImageUpload onImageChange={handleImageChange} />
      </FormSection>
      
      {!isEdit && (
        <FormSection 
          title="Documentation" 
          description="Upload required vehicle documentation for verification"
        >
          <DocumentUpload onDocumentChange={handleDocumentChange} />
        </FormSection>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (isEdit ? "Updating Car..." : "Adding Car...") : (isEdit ? "Update Car" : "Add Car")}
      </Button>
    </form>
  );
};
