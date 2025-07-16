import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bluetooth, Thermometer, Navigation, AirVent, Compass, Camera, Shield, KeyRound, Power, Radio, Sofa, MapPin, Smartphone, FolderTree, Webcam, Umbrella, Baby, Gauge, Cog, GaugeCircle, Users, Zap, Fuel, Car, Ruler, Weight, Package, Clock, Wrench } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CarSpecsProps {
  pricePerDay: number;
  transmission: string;
  seats: number;
  features?: string[];
  // New specification fields
  engine_size?: string;
  horsepower?: string;
  mileage?: number;
  color?: string;
  doors?: number;
  fuel_efficiency?: string;
  max_speed?: string;
  acceleration?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  trunk_capacity?: string;
  ground_clearance?: string;
  warranty?: string;
  maintenance_history?: string;
}

export const CarSpecs = ({ 
  pricePerDay, 
  transmission, 
  seats, 
  features = [],
  engine_size,
  horsepower,
  mileage,
  color,
  doors,
  fuel_efficiency,
  max_speed,
  acceleration,
  weight,
  length,
  width,
  height,
  trunk_capacity,
  ground_clearance,
  warranty,
  maintenance_history
}: CarSpecsProps) => {
  const [showDetailedSpecs, setShowDetailedSpecs] = useState(false);

  // Map features to corresponding icons
  const getFeatureIcon = (feature: string) => {
    switch(feature) {
      case "Air Conditioning": return <AirVent className="h-4 w-4" />;
      case "Bluetooth": return <Bluetooth className="h-4 w-4" />;
      case "Cruise Control": return <Gauge className="h-4 w-4" />;
      case "Navigation System": return <Compass className="h-4 w-4" />;
      case "Leather Seats": return <Sofa className="h-4 w-4" />;
      case "Sunroof": return <Umbrella className="h-4 w-4" />;
      case "Backup Camera": return <Camera className="h-4 w-4" />;
      case "Parking Sensors": return <Webcam className="h-4 w-4" />;
      case "Keyless Entry": return <KeyRound className="h-4 w-4" />;
      case "Push Start": return <Power className="h-4 w-4" />;
      case "Heated Seats": return <Thermometer className="h-4 w-4" />;
      case "Premium Sound": return <Radio className="h-4 w-4" />;
      case "Third Row Seating": return <Sofa className="h-4 w-4" />;
      case "Blind Spot Monitor": return <Shield className="h-4 w-4" />;
      case "360 Degree Camera": return <Camera className="h-4 w-4" />;
      case "Apple CarPlay": return <Smartphone className="h-4 w-4" />;
      case "Android Auto": return <Smartphone className="h-4 w-4" />; 
      case "Roof Rack": return <FolderTree className="h-4 w-4" />;
      case "Child Seat Anchor": return <Baby className="h-4 w-4" />;
      case "Autonomous Driving": return <Gauge className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  const hasDetailedSpecs = engine_size || horsepower || mileage || color || doors || fuel_efficiency || max_speed || acceleration || weight || length || width || height || trunk_capacity || ground_clearance || warranty || maintenance_history;

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
          Car Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Basic Specifications */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="p-4 bg-muted rounded-lg text-left w-full">
            <GaugeCircle className="w-4 h-4 text-primary dark:text-primary-foreground" />
            <p className="text-base md:text-xl text-left text-gray-700 dark:text-white font-medium mt-4">
              {transmission}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Transmission
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-left">
            <Users className="w-4 h-4 text-primary dark:text-primary-foreground" />
            <p className="text-base md:text-xl text-left text-gray-700 dark:text-white font-medium mt-4">
              {seats}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Passenger Seats
            </p>
          </div>
        </div>

        {/* Detailed Specifications */}
        {hasDetailedSpecs && (
          <Collapsible open={showDetailedSpecs} onOpenChange={setShowDetailedSpecs}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 mb-4">
                <span className="text-sm font-medium">Detailed Specifications</span>
                {showDetailedSpecs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {/* Engine & Performance */}
              {(engine_size || horsepower || max_speed || acceleration) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Engine & Performance
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {engine_size && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Engine Size</p>
                        <p className="text-sm font-medium">{engine_size}L</p>
                      </div>
                    )}
                    {horsepower && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Horsepower</p>
                        <p className="text-sm font-medium">{horsepower} hp</p>
                      </div>
                    )}
                    {max_speed && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Max Speed</p>
                        <p className="text-sm font-medium">{max_speed} km/h</p>
                      </div>
                    )}
                    {acceleration && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">0-100 km/h</p>
                        <p className="text-sm font-medium">{acceleration}s</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fuel & Efficiency */}
              {(fuel_efficiency || mileage) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    Fuel & Efficiency
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {fuel_efficiency && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Fuel Efficiency</p>
                        <p className="text-sm font-medium">{fuel_efficiency} L/100km</p>
                      </div>
                    )}
                    {mileage && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Mileage</p>
                        <p className="text-sm font-medium">{mileage.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Physical Specifications */}
              {(color || doors || weight || length || width || height || trunk_capacity || ground_clearance) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Physical Specifications
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {color && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p className="text-sm font-medium">{color}</p>
                      </div>
                    )}
                    {doors && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Doors</p>
                        <p className="text-sm font-medium">{doors}</p>
                      </div>
                    )}
                    {weight && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="text-sm font-medium">{weight} kg</p>
                      </div>
                    )}
                    {trunk_capacity && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Trunk Capacity</p>
                        <p className="text-sm font-medium">{trunk_capacity}L</p>
                      </div>
                    )}
                  </div>
                  {(length || width || height || ground_clearance) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {length && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Length</p>
                          <p className="text-sm font-medium">{length} mm</p>
                        </div>
                      )}
                      {width && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Width</p>
                          <p className="text-sm font-medium">{width} mm</p>
                        </div>
                      )}
                      {height && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-sm font-medium">{height} mm</p>
                        </div>
                      )}
                      {ground_clearance && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Ground Clearance</p>
                          <p className="text-sm font-medium">{ground_clearance} mm</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Warranty & Maintenance */}
              {(warranty || maintenance_history) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Warranty & Maintenance
                  </h4>
                  <div className="space-y-3">
                    {warranty && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Warranty</p>
                        <p className="text-sm font-medium">{warranty} months</p>
                      </div>
                    )}
                    {maintenance_history && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Maintenance History</p>
                        <p className="text-sm">{maintenance_history}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <>
            <h3 className="mb-3 text-base text-left text-muted-foreground dark:text-white font-medium">
              Car Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center space-x-2 p-2 rounded-md border bg-muted/30"
                >
                  <span className="text-primary">
                    {getFeatureIcon(feature)}
                  </span>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
