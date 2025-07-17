
import { CarSpecs as UnifiedCarSpecs } from "@/components/shared/CarSpecs";

interface CarSpecsProps {
  pricePerDay: number;
  transmission: string;
  seats: number;
  features?: string[];
}

export const CarSpecs = ({ pricePerDay, transmission, seats, features = [] }: CarSpecsProps) => {
  return (
    <UnifiedCarSpecs 
      transmission={transmission} 
      fuel="Petrol" // Default fuel type since it's not in the props
      seats={seats} 
      pricePerDay={pricePerDay}
      features={features}
      variant="card"
    />
  );
};
