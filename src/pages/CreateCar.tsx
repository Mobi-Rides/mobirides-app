
import { CarForm } from "@/components/add-car/CarForm";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VehicleType } from "@/types/location";

// Create a type that matches the expected CarFormData type from CarForm component
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
  fuel: string;
  seats: number;
  transmission: string;
}

const CreateCar = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Create proper initial data that conforms to CarFormData type
  const initialData: CarFormData = {
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vehicle_type: "Basic" as VehicleType,
    price_per_day: "0",
    location: "",
    latitude: 0,
    longitude: 0,
    description: "",
    features: [],
    fuel: "",
    seats: 0,
    transmission: ""
  };
  
  const handleSubmit = async (carData: CarFormData, imageFile: File | null, documents: Record<string, File | FileList>, features: string[]) => {
    setIsSubmitting(true);
    // Submission logic would go here
    setIsSubmitting(false);
    navigate('/cars');
  };
  
  const handleFeaturesChange = (features: string[]) => {
    setSelectedFeatures(features);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">List Your Car</h1>
          <CarForm 
            initialData={initialData}
            selectedFeatures={selectedFeatures}
            onFeaturesChange={handleFeaturesChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default CreateCar;
