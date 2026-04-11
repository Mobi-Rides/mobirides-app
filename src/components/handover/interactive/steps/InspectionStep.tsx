
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Check, Loader2, Upload, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { uploadHandoverPhoto } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface InspectionStepProps {
  title: string;
  description: string;
  handoverSessionId: string;
  type: 'exterior' | 'interior';
  onComplete: (data: { photos: string[] }) => void;
  isSubmitting: boolean;
}

export const InspectionStep: React.FC<InspectionStepProps> = ({
  title,
  description,
  handoverSessionId,
  type,
  onComplete,
  isSubmitting
}) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const photoUrl = await uploadHandoverPhoto(
        file, 
        handoverSessionId, 
        type === 'exterior' ? 'exterior_front' : 'interior_dashboard',
        3,
        (progress) => setUploadProgress(progress)
      );
      
      if (photoUrl) {
        setPhotos(prev => [...prev, photoUrl]);
      }
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
              <img src={url} alt={`Inspection ${index + 1}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          <div className="relative aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center space-y-2 bg-muted/30 hover:bg-muted/50 transition-colors">
            <Camera className="h-6 w-6 text-muted-foreground" />
            <span className="text-[10px] font-medium text-muted-foreground">Add Photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
          </div>
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-[10px] text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Please take clear photos of the vehicle {type}. Minimum 2 photos recommended.
          </p>
        </div>

        <Button 
          className="w-full h-12 text-lg" 
          onClick={() => onComplete({ photos })}
          disabled={isSubmitting || photos.length < 1}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Finish {type === 'exterior' ? 'Exterior' : 'Interior'} Inspection
        </Button>
      </CardContent>
    </Card>
  );
};
