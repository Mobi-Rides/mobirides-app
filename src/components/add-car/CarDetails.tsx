
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CarDetailsProps {
  formData: {
    price_per_day: string;
    location: string;
    transmission: string;
    fuel: string;
    seats: number; // Changed from string to number
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const CarDetails = ({ formData, onInputChange, onSelectChange }: CarDetailsProps) => {
  return (
    <>
      <div className="space-y-2 text-left">
        <Label htmlFor="price_per_day">Price per Day (BWP)</Label>
        <Input
          id="price_per_day"
          name="price_per_day"
          type="number"
          value={formData.price_per_day}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={onInputChange}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="transmission">Transmission</Label>
          <Select
            value={formData.transmission}
            onValueChange={(value) => onSelectChange("transmission", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="fuel">Fuel Type</Label>
          <Select
            value={formData.fuel}
            onValueChange={(value) => onSelectChange("fuel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="seats">Number of Seats</Label>
        <Input
          id="seats"
          name="seats"
          type="number"
          value={formData.seats}
          onChange={onInputChange}
          required
        />
      </div>
    </>
  );
};
