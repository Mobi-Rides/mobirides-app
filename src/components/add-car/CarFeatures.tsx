
import React from "react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// List of predefined car features
export const CAR_FEATURES = [
  "Air Conditioning",
  "Bluetooth",
  "Cruise Control",
  "Navigation System",
  "Leather Seats",
  "Sunroof",
  "Backup Camera",
  "Parking Sensors",
  "Keyless Entry",
  "Push Start",
  "Heated Seats",
  "Premium Sound",
  "Third Row Seating",
  "Blind Spot Monitor",
  "360 Degree Camera",
  "Apple CarPlay",
  "Android Auto",
  "Roof Rack",
  "Child Seat Anchor",
  "Autonomous Driving"
];

interface CarFeaturesProps {
  selectedFeatures: string[];
  onChange: (features: string[]) => void;
}

export const CarFeatures: React.FC<CarFeaturesProps> = ({
  selectedFeatures,
  onChange
}) => {
  const handleToggleFeature = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    onChange(newFeatures);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Car Features</h3>
        <p className="text-sm text-muted-foreground">
          Selected: {selectedFeatures.length}
        </p>
      </div>
      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CAR_FEATURES.map((feature) => (
          <div 
            key={feature} 
            className="flex items-center space-x-2 p-2 rounded-md border cursor-pointer hover:bg-accent/30 transition-colors"
            onClick={() => handleToggleFeature(feature)}
          >
            <Checkbox 
              id={`feature-${feature}`}
              checked={selectedFeatures.includes(feature)}
              onCheckedChange={() => handleToggleFeature(feature)}
            />
            <Label 
              htmlFor={`feature-${feature}`}
              className="cursor-pointer text-sm"
            >
              {feature}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
