import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// List of predefined car features organized by category - streamlined for better UX
export const CAR_FEATURES = {
  comfort: [
    "Air Conditioning",
    "Heated Seats",
    "Leather Seats",
    "Sunroof",
    "Climate Control",
    "Power Seats",
    "Third Row Seating"
  ],
  technology: [
    "Bluetooth",
    "Apple CarPlay",
    "Android Auto",
    "Navigation System",
    "Touchscreen Display",
    "Wireless Charging",
    "Backup Camera"
  ],
  safety: [
    "Backup Camera",
    "Parking Sensors",
    "Blind Spot Monitor",
    "Lane Departure Warning",
    "Automatic Emergency Braking",
    "Child Seat Anchors"
  ],
  convenience: [
    "Cruise Control",
    "Keyless Entry",
    "Power Windows",
    "Power Mirrors",
    "Automatic Headlights",
    "Roof Rack"
  ],
  performance: [
    "All-Wheel Drive",
    "Four-Wheel Drive",
    "Sport Mode",
    "Traction Control"
  ]
};

// Flatten all features for the checkbox list
export const ALL_CAR_FEATURES = Object.values(CAR_FEATURES).flat();

interface CarFeaturesProps {
  selectedFeatures: string[];
  onChange: (features: string[]) => void;
}

export const CarFeatures: React.FC<CarFeaturesProps> = ({
  selectedFeatures,
  onChange
}) => {
  const [openCategories, setOpenCategories] = useState<string[]>(['comfort', 'technology']);

  const handleToggleFeature = (feature: string) => {
    try {
      console.log("Feature toggled:", feature);
      console.log("Current selected features:", selectedFeatures);
      
      const newFeatures = selectedFeatures.includes(feature)
        ? selectedFeatures.filter(f => f !== feature)
        : [...selectedFeatures, feature];
      
      console.log("New selected features:", newFeatures);
      onChange(newFeatures);
    } catch (error) {
      console.error("Error toggling feature:", error);
    }
  };

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'comfort': return '🛋️';
      case 'technology': return '📱';
      case 'safety': return '🛡️';
      case 'convenience': return '⚡';
      case 'performance': return '🏎️';
      default: return '🚗';
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'comfort': return 'Comfort & Interior';
      case 'technology': return 'Technology & Connectivity';
      case 'safety': return 'Safety & Security';
      case 'convenience': return 'Convenience Features';
      case 'performance': return 'Performance & Drive';
      default: return category;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Car Features & Amenities</h3>
        <p className="text-sm text-muted-foreground">
          Selected: {selectedFeatures?.length || 0}
        </p>
      </div>
      <Separator />
      
      <div className="space-y-3">
        {Object.entries(CAR_FEATURES).map(([category, features]) => (
          <Collapsible
            key={category}
            open={openCategories.includes(category)}
            onOpenChange={() => toggleCategory(category)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <span className="font-medium">{getCategoryTitle(category)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({features.filter(f => selectedFeatures.includes(f)).length}/{features.length})
                  </span>
                </div>
                {openCategories.includes(category) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4">
                {features.map((feature) => (
                  <div 
                    key={feature} 
                    className="flex items-center space-x-2 p-2 rounded-md border cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Checkbox 
                      id={`feature-${feature}`}
                      checked={selectedFeatures?.includes(feature)}
                      onCheckedChange={() => handleToggleFeature(feature)}
                    />
                    <Label 
                      htmlFor={`feature-${feature}`}
                      className="cursor-pointer text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleFeature(feature);
                      }}
                    >
                      {feature}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};
