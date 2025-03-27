import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bluetooth, Thermometer, Navigation, AirVent, Compass, Camera, Shield, KeyRound, Power, Radio, Sofa, MapPin, Smartphone, FolderTree, Webcam, Umbrella, Baby, Gauge, Cog, GaugeCircle, Users } from "lucide-react";

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

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-left text-muted-foreground dark:text-white font-medium">
          Car Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Updated grid columns for pricing details now only for transmission and seats */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div className="p-4 bg-muted rounded-lg text-left w-full ">
            <GaugeCircle className="w-4 h-4 text-primary dark:text-primary-foreground" />

            <p className="text-base md:text-xl text-left text-gray-700 dark:text-white font-medium mt-4">
              {transmission}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground ">
              Car Fuel
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-left">
            <Users className="w-4 h-4 text-primary dark:text-primary-foreground" />
            <p className="text-base md:text-xl text-left text-gray-700 dark:text-white font-medium mt-4">
              {seats}
            </p>
            <p className="text-xs md:text-sm text-muted-foreground ">
              Passenger Seats
            </p>
          </div>
        </div>

        {features && features.length > 0 && (
          <>
            <h3 className=" mb-3 text-base text-left text-muted-foreground dark:text-white font-medium">
              Car Features
            </h3>
            {/* Updated grid for features: additional column on large screens */}
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
