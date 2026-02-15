
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Fuel, Gauge, Check, Loader2, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { uploadHandoverPhoto } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface FuelMileageStepProps {
  handoverSessionId: string;
  onComplete: (data: { fuel_level: number; mileage: number; photos: string[] }) => void;
  isSubmitting: boolean;
}

export const FuelMileageStep: React.FC<FuelMileageStepProps> = ({
  handoverSessionId,
  onComplete,
  isSubmitting
}) => {
  const [fuelLevel, setFuelLevel] = useState(50);
  const [mileage, setMileage] = useState<string>("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'fuel_gauge' | 'odometer') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const photoUrl = await uploadHandoverPhoto(file, handoverSessionId, type);
      if (photoUrl) {
        setPhotos(prev => [...prev, photoUrl]);
      }
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Fuel & Mileage
        </CardTitle>
        <p className="text-sm text-muted-foreground">Record the current fuel level and odometer reading.</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Fuel Level */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Fuel className="h-4 w-4 text-muted-foreground" />
              Fuel Level
            </label>
            <span className="text-lg font-bold text-primary">{fuelLevel}%</span>
          </div>
          <Slider
            value={[fuelLevel]}
            onValueChange={(val) => setFuelLevel(val[0])}
            max={100}
            step={5}
            className="py-4"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium uppercase">
            <span>Empty</span>
            <span>Half</span>
            <span>Full</span>
          </div>
        </div>

        {/* Mileage */}
        <div className="space-y-3">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            Odometer Reading
          </label>
          <div className="relative">
            <Input
              type="number"
              placeholder="Enter current mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="text-lg font-mono h-12"
            />
            <span className="absolute right-3 top-3 text-muted-foreground font-medium">km</span>
          </div>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center space-y-2 bg-muted/30">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-center font-medium">Fuel Gauge Photo</span>
            <input 
              type="file" accept="image/*" capture="environment" 
              onChange={(e) => handlePhotoUpload(e, 'fuel_gauge')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <div className="relative border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center space-y-2 bg-muted/30">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] text-center font-medium">Odometer Photo</span>
            <input 
              type="file" accept="image/*" capture="environment" 
              onChange={(e) => handlePhotoUpload(e, 'odometer')}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <Button 
          className="w-full h-12 text-lg" 
          onClick={() => onComplete({ fuel_level: fuelLevel, mileage: parseInt(mileage), photos })}
          disabled={isSubmitting || !mileage || isUploading}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Fuel & Mileage
        </Button>
      </CardContent>
    </Card>
  );
};
