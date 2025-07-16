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
  engine_size?: string;
  horsepower?: string;
  mileage?: string;
  fuel_efficiency?: string;
  max_speed?: string;
  warranty?: string;
  maintenance_history?: string;
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
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CarFormData>(initialData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<{
    registration?: File;
    insurance?: File;
    additional?: FileList;
  }>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    setFormErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'vehicle_type') {
      setFormData((prev) => ({ ...prev, [name]: value as VehicleType }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setFormErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
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
    // Validate important fields
    const errors: Record<string, string> = {};
    if (!formData.brand.trim()) errors.brand = "Brand is required.";
    if (!formData.model.trim()) errors.model = "Model is required.";
    if (!formData.year || formData.year < 2000 || formData.year > new Date().getFullYear() + 1) errors.year = `Year must be between 2000 and ${new Date().getFullYear() + 1}.`;
    if (!formData.price_per_day || isNaN(Number(formData.price_per_day)) || Number(formData.price_per_day) <= 0) errors.price_per_day = "Price per day must be a positive number.";
    if (!formData.location.trim()) errors.location = "Location is required.";
    if (!formData.seats || formData.seats < 2 || formData.seats > 15) errors.seats = "Seats must be between 2 and 15.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
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
          errors={formErrors}
        />
      </FormSection>

      <FormSection 
        title="Vehicle Specifications" 
        description="Provide comprehensive technical details, performance metrics, and pricing information"
      >
        <CarDetails
          formData={formData}
          onInputChange={handleInputChange}
          onSelectChange={handleSelectChange}
          errors={formErrors}
        />
      </FormSection>
      
      <FormSection 
        title="Features & Amenities" 
        description="Select from a comprehensive list of comfort, technology, safety, and performance features"
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

      <div className="flex gap-4">
        <Button 
          type="button" 
          variant="destructive" 
          className="flex-1" 
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? "Updating Car..." : "Adding Car...") : (isEdit ? "Update Car" : "Add Car")}
        </Button>
      </div>
    </form>
  );
};
