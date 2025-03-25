
import { CarForm } from "@/components/add-car/CarForm";
import { Navigation } from "@/components/Navigation";

const CreateCar = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-16">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">List Your Car</h1>
          <CarForm />
        </div>
      </main>
      <Navigation />
    </div>
  );
};

export default CreateCar;
