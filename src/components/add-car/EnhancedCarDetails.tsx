import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EnhancedCarDetailsProps {
  formData: {
    price_per_day: string;
    location: string;
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
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

export const EnhancedCarDetails = ({ formData, onInputChange, onSelectChange }: EnhancedCarDetailsProps) => {
  return (
    <>
      {/* Existing Fields */}
      <div className="space-y-2 text-left">
        <Label htmlFor="price_per_day">Price per Day (BWP) *</Label>
        <Input
          id="price_per_day"
          name="price_per_day"
          type="number"
          min="0"
          step="0.01"
          value={formData.price_per_day}
          onChange={onInputChange}
          required
          className="animate-fade-in"
        />
      </div>

      <div className="space-y-2 text-left">
        <Label htmlFor="location">Location (City, Country) *</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={onInputChange}
          placeholder="e.g., Gaborone, Botswana"
          required
          className="animate-fade-in"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="transmission">Transmission *</Label>
          <Select
            value={formData.transmission}
            onValueChange={(value) => onSelectChange("transmission", value)}
          >
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="Select transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Auto">Automatic</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="CVT">CVT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="fuel">Fuel Type *</Label>
          <Select
            value={formData.fuel}
            onValueChange={(value) => onSelectChange("fuel", value)}
          >
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Petrol">Petrol</SelectItem>
              <SelectItem value="Diesel">Diesel</SelectItem>
              <SelectItem value="Electric">Electric</SelectItem>
              <SelectItem value="Hybrid">Hybrid</SelectItem>
              <SelectItem value="Plug-in Hybrid">Plug-in Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="seats">Number of Seats *</Label>
          <Input
            id="seats"
            name="seats"
            type="number"
            min="2"
            max="15"
            value={formData.seats}
            onChange={onInputChange}
            required
            className="animate-fade-in"
          />
          <p className="text-xs text-muted-foreground">Between 2 and 15 seats</p>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="doors">Number of Doors</Label>
          <Select
            value={formData.doors?.toString() || ""}
            onValueChange={(value) => onSelectChange("doors", value)}
          >
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="Select doors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Doors</SelectItem>
              <SelectItem value="3">3 Doors</SelectItem>
              <SelectItem value="4">4 Doors</SelectItem>
              <SelectItem value="5">5 Doors</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* New Enhanced Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="engine_size">Engine Size (L)</Label>
          <Input
            id="engine_size"
            name="engine_size"
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={formData.engine_size || ""}
            onChange={onInputChange}
            placeholder="e.g., 2.0"
            className="animate-fade-in"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="max_speed">Max Speed (km/h)</Label>
          <Input
            id="max_speed"
            name="max_speed"
            type="number"
            min="50"
            max="400"
            value={formData.max_speed || ""}
            onChange={onInputChange}
            placeholder="e.g., 180"
            className="animate-fade-in"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="fuel_efficiency">Fuel Efficiency (L/100km)</Label>
          <Input
            id="fuel_efficiency"
            name="fuel_efficiency"
            type="number"
            min="1"
            max="50"
            step="0.1"
            value={formData.fuel_efficiency || ""}
            onChange={onInputChange}
            placeholder="e.g., 8.5"
            className="animate-fade-in"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="current_mileage">Current Mileage (km)</Label>
          <Input
            id="current_mileage"
            name="current_mileage"
            type="number"
            min="0"
            value={formData.current_mileage || ""}
            onChange={onInputChange}
            placeholder="e.g., 45000"
            className="animate-fade-in"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="warranty_months">Warranty (months)</Label>
          <Input
            id="warranty_months"
            name="warranty_months"
            type="number"
            min="0"
            max="120"
            value={formData.warranty_months || ""}
            onChange={onInputChange}
            placeholder="e.g., 24"
            className="animate-fade-in"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="color">Color</Label>
          <Select
            value={formData.color || ""}
            onValueChange={(value) => onSelectChange("color", value)}
          >
            <SelectTrigger className="animate-fade-in">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="White">White</SelectItem>
              <SelectItem value="Black">Black</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Gray">Gray</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
              <SelectItem value="Blue">Blue</SelectItem>
              <SelectItem value="Green">Green</SelectItem>
              <SelectItem value="Yellow">Yellow</SelectItem>
              <SelectItem value="Orange">Orange</SelectItem>
              <SelectItem value="Brown">Brown</SelectItem>
              <SelectItem value="Purple">Purple</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};
