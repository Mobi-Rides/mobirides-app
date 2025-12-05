
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CarBasicInfo } from "@/components/add-car/CarBasicInfo";
import { EnhancedCarDetails } from "@/components/add-car/EnhancedCarDetails";
import { CarDescription } from "@/components/add-car/CarDescription";
import { MultiImageUpload } from "@/components/add-car/MultiImageUpload";
import { CarImageManager } from "@/components/add-car/CarImageManager";
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
  engine_size?: number;
  max_speed?: number;
  fuel_efficiency?: number;
  current_mileage?: number;
  warranty_months?: number;
  color?: string;
  doors?: number;
}

interface CarFormProps {
  initialData: CarFormData;
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  isEdit?: boolean;
  carId?: string;
  mainImageUrl?: string | null;
  onSubmit: (formData: CarFormData, imageFiles: File[], documents: Record<string, File | FileList>, features: string[]) => Promise<void>;
  isSubmitting: boolean;
}

export const CarForm = ({
  initialData,
  selectedFeatures,
  onFeaturesChange,
  isEdit = false,
  carId,
  mainImageUrl,
  onSubmit,
  isSubmitting
}: CarFormProps) => {
  const [formData, setFormData] = useState<CarFormData>(initialData);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<{
    registration?: File;
    insurance?: File;
    additional?: FileList;
  }>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Convert numeric inputs to the right type
    if (name === 'year' || name === 'seats' || name === 'doors') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === 'engine_size' || name === 'max_speed' || name === 'fuel_efficiency' || name === 'current_mileage' || name === 'warranty_months') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || undefined }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'vehicle_type') {
      setFormData((prev) => ({ ...prev, [name]: value as VehicleType }));
    } else if (name === 'doors') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || undefined }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
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
    
    // Validate seats range
    if (formData.seats < 2 || formData.seats > 15) {
      return;
    }
    
    await onSubmit(formData, imageFiles, documents, selectedFeatures);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
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
        <EnhancedCarDetails
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
        description={isEdit ? "Manage your vehicle photos - add, delete, or change the main photo" : "Upload multiple photos to showcase your vehicle (up to 10)"}
      >
        {isEdit && carId ? (
          <CarImageManager 
            carId={carId} 
            mainImageUrl={mainImageUrl || null} 
          />
        ) : (
          <MultiImageUpload onImagesChange={handleImagesChange} />
        )}
      </FormSection>
      
      {!isEdit && (
        <FormSection 
          title="Documentation" 
          description="Upload required vehicle documentation for verification"
        >
          <DocumentUpload onDocumentChange={handleDocumentChange} />
        </FormSection>
      )}

      <Button 
        type="submit" 
        className="w-full hover-scale" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (isEdit ? "Updating Car..." : "Adding Car...") : (isEdit ? "Update Car" : "Add Car")}
      </Button>
    </form>
  );
};
