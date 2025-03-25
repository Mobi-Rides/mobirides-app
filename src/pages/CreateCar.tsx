
import { CarForm } from "@/components/add-car/CarForm";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateCar = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const handleSubmit = async (carData: any) => {
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
            initialData={{}}
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
