import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    seats: number;
    engine_size?: string;
    mileage?: string;
    fuel_efficiency?: string;
    max_speed?: string;
    warranty?: string;
    maintenance_history?: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  errors?: Record<string, string>;
}

export const CarDetails = ({ formData, onInputChange, onSelectChange, errors = {} }: CarDetailsProps) => {
  return (
    <div className="space-y-6">
      {/* Pricing and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="price_per_day">Price per Day (BWP) *</Label>
          <Input
            id="price_per_day"
            name="price_per_day"
            type="number"
            value={formData.price_per_day}
            onChange={onInputChange}
            required
            placeholder="e.g., 500"
          />
          <span className="text-xs text-muted-foreground">Enter a positive number (e.g., 500)</span>
          {errors.price_per_day && <span className="text-xs text-red-500">{errors.price_per_day}</span>}
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            name="location"
            value={formData.location}
            onChange={onInputChange}
            required
            placeholder="e.g., Gaborone, Botswana"
          />
          <span className="text-xs text-muted-foreground">City, Country (e.g., Gaborone, Botswana)</span>
          {errors.location && <span className="text-xs text-red-500">{errors.location}</span>}
        </div>
      </div>

      {/* Basic Specifications */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="transmission">Transmission *</Label>
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
              <SelectItem value="CVT">CVT</SelectItem>
              <SelectItem value="Semi-Auto">Semi-Automatic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="fuel">Fuel Type *</Label>
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
              <SelectItem value="Plug-in Hybrid">Plug-in Hybrid</SelectItem>
              <SelectItem value="LPG">LPG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="seats">Number of Seats *</Label>
          <Input
            id="seats"
            name="seats"
            type="number"
            value={formData.seats}
            onChange={onInputChange}
            required
            min="2"
            max="15"
            placeholder="e.g., 5"
          />
          <span className="text-xs text-muted-foreground">Between 2 and 15</span>
          {errors.seats && <span className="text-xs text-red-500">{errors.seats}</span>}
        </div>
      </div>

      {/* Engine and Performance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="engine_size">Engine Size (L)</Label>
          <Input
            id="engine_size"
            name="engine_size"
            value={formData.engine_size}
            onChange={onInputChange}
            placeholder="e.g., 2.0"
          />
        </div>


        <div className="space-y-2 text-left">
          <Label htmlFor="max_speed">Max Speed (km/h)</Label>
          <Input
            id="max_speed"
            name="max_speed"
            value={formData.max_speed}
            onChange={onInputChange}
            placeholder="e.g., 200"
          />
        </div>

      </div>

      {/* Fuel Efficiency and Mileage */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 text-left">
          <Label htmlFor="fuel_efficiency">Fuel Efficiency (L/100km)</Label>
          <Input
            id="fuel_efficiency"
            name="fuel_efficiency"
            value={formData.fuel_efficiency}
            onChange={onInputChange}
            placeholder="e.g., 7.5"
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="mileage">Current Mileage (km)</Label>
          <Input
            id="mileage"
            name="mileage"
            type="number"
            value={formData.mileage}
            onChange={onInputChange}
            placeholder="e.g., 50000"
          />
        </div>
      </div>

      {/* Warranty */}
      <div className="space-y-2 text-left">
        <Label htmlFor="warranty">Warranty (months)</Label>
        <Input
          id="warranty"
          name="warranty"
          value={formData.warranty}
          onChange={onInputChange}
          placeholder="e.g., 36"
        />
      </div>

      {/* Maintenance History */}
      <div className="space-y-2 text-left">
        <Label htmlFor="maintenance_history">Maintenance History</Label>
        <Textarea
          id="maintenance_history"
          name="maintenance_history"
          value={formData.maintenance_history}
          onChange={onInputChange}
          placeholder="Describe the vehicle's maintenance history, recent services, repairs, etc."
          rows={3}
        />
      </div>
    </div>
  );
};
