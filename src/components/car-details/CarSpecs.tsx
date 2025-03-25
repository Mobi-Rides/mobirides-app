
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bluetooth, Thermometer, Navigation, AirVent, Compass, Camera, Shield, KeyRound, Power, Radio, Sofa, MapPin, Smartphone, FolderTree, Webcam, Umbrella, Baby, Gauge, Cog } from "lucide-react";

interface CarSpecsProps {
  pricePerDay: number;
  transmission: string;
  seats: number;
  features?: string[];
}

export const CarSpecs = ({ pricePerDay, transmission, seats, features = [] }: CarSpecsProps) => {
  // Map features to corresponding icons
  const getFeatureIcon = (feature: string) => {
    switch(feature) {
      case "Air Conditioning": return <AirVent className="h-5 w-5" />;
      case "Bluetooth": return <Bluetooth className="h-5 w-5" />;
      case "Cruise Control": return <Gauge className="h-5 w-5" />;
      case "Navigation System": return <Compass className="h-5 w-5" />;
      case "Leather Seats": return <Sofa className="h-5 w-5" />;
      case "Sunroof": return <Umbrella className="h-5 w-5" />;
      case "Backup Camera": return <Camera className="h-5 w-5" />;
      case "Parking Sensors": return <Webcam className="h-5 w-5" />;
      case "Keyless Entry": return <KeyRound className="h-5 w-5" />;
      case "Push Start": return <Power className="h-5 w-5" />;
      case "Heated Seats": return <Thermometer className="h-5 w-5" />;
      case "Premium Sound": return <Radio className="h-5 w-5" />;
      case "Third Row Seating": return <Sofa className="h-5 w-5" />;
      case "Blind Spot Monitor": return <Shield className="h-5 w-5" />;
      case "360 Degree Camera": return <Camera className="h-5 w-5" />;
      case "Apple CarPlay": return <Smartphone className="h-5 w-5" />;
      case "Android Auto": return <Smartphone className="h-5 w-5" />; 
      case "Roof Rack": return <FolderTree className="h-5 w-5" />;
      case "Child Seat Anchor": return <Baby className="h-5 w-5" />;
      case "Autonomous Driving": return <Gauge className="h-5 w-5" />;
      default: return <CheckSquare className="h-5 w-5" />;
    }
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <Cog className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Vehicle Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm mb-6">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold text-lg md:text-xl">BWP {pricePerDay}</p>
            <p className="text-muted-foreground">per day</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold text-base md:text-lg">{transmission}</p>
            <p className="text-muted-foreground">transmission</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold text-lg md:text-xl">{seats}</p>
            <p className="text-muted-foreground">seats</p>
          </div>
        </div>

        {features && features.length > 0 && (
          <>
            <h3 className="text-lg font-medium mb-3">Features</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-center space-x-2 p-2 rounded-md border bg-muted/30">
                  <span className="text-primary">{getFeatureIcon(feature)}</span>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
