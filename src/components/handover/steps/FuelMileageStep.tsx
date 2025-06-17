
import { useState } from "react";
import { Gauge, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/utils/toast-utils";

interface FuelMileageStepProps {
  handoverSessionId: string;
  onFuelLevelChange: (level: number) => void;
  onMileageChange: (mileage: number) => void;
  onStepComplete: () => void;
  initialFuelLevel?: number;
  initialMileage?: number;
}

export const FuelMileageStep = ({
  handoverSessionId,
  onFuelLevelChange,
  onMileageChange,
  onStepComplete,
  initialFuelLevel,
  initialMileage
}: FuelMileageStepProps) => {
  const [fuelLevel, setFuelLevel] = useState<number>(initialFuelLevel || 50);
  const [mileage, setMileage] = useState<string>(initialMileage?.toString() || "");

  const handleFuelChange = (value: number[]) => {
    const level = value[0];
    setFuelLevel(level);
    onFuelLevelChange(level);
  };

  const handleMileageChange = (value: string) => {
    setMileage(value);
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue)) {
      onMileageChange(numericValue);
    }
  };

  const canComplete = mileage !== "" && !isNaN(parseInt(mileage, 10)) && parseInt(mileage, 10) > 0;

  const handleComplete = () => {
    if (canComplete) {
      onStepComplete();
      toast.success("Fuel level and mileage recorded successfully");
    } else {
      toast.error("Please enter a valid mileage reading");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Fuel Level & Mileage Check
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Record the current fuel level and vehicle mileage for documentation
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fuel Level Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Fuel Level (%)</Label>
            <div className="mt-2">
              <Slider
                value={[fuelLevel]}
                onValueChange={handleFuelChange}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Empty (0%)</span>
                <span className="font-medium">{fuelLevel}%</span>
                <span>Full (100%)</span>
              </div>
            </div>
          </div>

          {/* Visual fuel gauge indicator */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32 border-4 border-gray-300 rounded-full">
              <div 
                className="absolute inset-2 rounded-full transition-all duration-300"
                style={{
                  background: `conic-gradient(
                    ${fuelLevel <= 25 ? '#ef4444' : fuelLevel <= 50 ? '#f59e0b' : '#10b981'} 0deg,
                    ${fuelLevel <= 25 ? '#ef4444' : fuelLevel <= 50 ? '#f59e0b' : '#10b981'} ${(fuelLevel / 100) * 360}deg,
                    #e5e7eb ${(fuelLevel / 100) * 360}deg
                  )`
                }}
              />
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{fuelLevel}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mileage Section */}
        <div className="space-y-2">
          <Label htmlFor="mileage" className="text-sm font-medium">
            Current Mileage (km)
          </Label>
          <div className="relative">
            <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="mileage"
              type="number"
              placeholder="Enter current mileage"
              value={mileage}
              onChange={(e) => handleMileageChange(e.target.value)}
              className="pl-10"
              min="0"
            />
          </div>
          {mileage && !isNaN(parseInt(mileage, 10)) && (
            <p className="text-xs text-muted-foreground">
              Recorded: {parseInt(mileage, 10).toLocaleString()} kilometers
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fuel Level:</span>
              <p className="font-medium">{fuelLevel}%</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mileage:</span>
              <p className="font-medium">
                {mileage ? `${parseInt(mileage, 10).toLocaleString()} km` : "Not entered"}
              </p>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <Button 
          onClick={handleComplete} 
          disabled={!canComplete}
          className="w-full"
        >
          Complete Fuel & Mileage Check
        </Button>

        {!canComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              Please enter a valid mileage reading to proceed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
