
import { CarSpecs as UnifiedCarSpecs } from "@/components/shared/CarSpecs";

interface CarSpecsProps {
  transmission: string;
  fuel: string;
  seats: number;
}

export const CarSpecs = ({ transmission, fuel, seats }: CarSpecsProps) => {
  return <UnifiedCarSpecs transmission={transmission} fuel={fuel} seats={seats} variant="grid" />;
};
