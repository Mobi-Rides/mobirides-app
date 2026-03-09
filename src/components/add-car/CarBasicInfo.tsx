
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContextualHelp } from "@/components/guides/ContextualHelp";
import type { Database } from "@/integrations/supabase/types";

type VehicleType = Database['public']['Enums']['vehicle_type'];

interface CarBasicInfoProps {
  formData: {
    brand: string;
    model: string;
    year: number;
    vehicle_type: VehicleType;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const CarBasicInfo = ({ formData, onInputChange, onSelectChange }: CarBasicInfoProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2 text-left">
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={onInputChange}
          required
        />
      </div>
      
      <div className="space-y-2 text-left">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          name="model"
          value={formData.model}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          name="year"
          type="number"
          value={formData.year}
          onChange={onInputChange}
          required
        />
      </div>
      
      <div className="space-y-2 text-left">
        <Label htmlFor="vehicle_type" className="flex items-center gap-1.5">Vehicle Type <ContextualHelp helpText="Choose the category that best describes your vehicle. This helps renters find the right car." guideSection="listing" role="host" /></Label>
        <Select
          value={formData.vehicle_type}
          onValueChange={(value) => onSelectChange("vehicle_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {["Basic", "Standard", "Executive", "4x4", "SUV", "Electric", "Exotic"].map(
              (type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
