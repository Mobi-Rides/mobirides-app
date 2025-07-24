
import { useState, useRef } from "react";
import { Camera, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadHandoverPhoto, VehiclePhoto } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface VehicleInspectionStepProps {
  handoverSessionId: string;
  inspectionType: 'exterior' | 'interior';
  onPhotosUpdate: (photos: VehiclePhoto[]) => void;
  onStepComplete: () => void;
  initialPhotos?: VehiclePhoto[];
}

const PHOTO_REQUIREMENTS = {
  exterior: [
    { type: 'exterior_front', label: 'Front View', required: true },
    { type: 'exterior_back', label: 'Rear View', required: true },
    { type: 'exterior_left', label: 'Left Side', required: true },
    { type: 'exterior_right', label: 'Right Side', required: true },
  ],
  interior: [
    { type: 'interior_dashboard', label: 'Dashboard', required: true },
    { type: 'interior_seats', label: 'Seats', required: true },
    { type: 'fuel_gauge', label: 'Fuel Gauge', required: true },
    { type: 'odometer', label: 'Odometer', required: true },
  ]
};

export const VehicleInspectionStep = ({
  handoverSessionId,
  inspectionType,
  onPhotosUpdate,
  onStepComplete,
  initialPhotos = []
}: VehicleInspectionStepProps) => {
  const [photos, setPhotos] = useState<VehiclePhoto[]>(initialPhotos);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const requirements = PHOTO_REQUIREMENTS[inspectionType];
  const requiredPhotos = requirements.filter(req => req.required);
  const completedRequired = requiredPhotos.filter(req => 
    photos.some(photo => photo.type === req.type)
  );

  const handlePhotoUpload = async (photoType: string, file: File) => {
    setIsUploading(true);
    setUploadingType(photoType);
    
    try {
      const photoUrl = await uploadHandoverPhoto(file, handoverSessionId, photoType);
      if (photoUrl) {
        const newPhoto: VehiclePhoto = {
          id: `${Date.now()}-${photoType}`,
          type: photoType as any,
          url: photoUrl,
          timestamp: new Date().toISOString()
        };

        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosUpdate(updatedPhotos);
        toast.success("Photo uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      setUploadingType(null);
    }
  };

  const handlePhotoUploadClick = (photoType: string) => {
    const input = fileInputRefs.current[photoType];
    if (input) {
      setUploadingType(photoType);
      input.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, photoType: string) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(photoType, file);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosUpdate(updatedPhotos);
  };

  const getPhotoForType = (type: string) => {
    return photos.find(photo => photo.type === type);
  };

  const canComplete = completedRequired.length === requiredPhotos.length;

  const handleComplete = () => {
    if (canComplete) {
      onStepComplete();
      toast.success(`${inspectionType} inspection completed`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {inspectionType === 'exterior' ? 'Exterior' : 'Interior'} Inspection
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={canComplete ? "default" : "secondary"}>
            {completedRequired.length}/{requiredPhotos.length} Required Photos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {requirements.map((requirement) => {
            const existingPhoto = getPhotoForType(requirement.type);
            const isUploading = uploadingType === requirement.type;

            return (
              <div key={requirement.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{requirement.label}</span>
                  {requirement.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>

                {existingPhoto ? (
                  <div className="relative group">
                    <img
                      src={existingPhoto.url}
                      alt={requirement.label}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(existingPhoto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => handlePhotoUploadClick(requirement.type)}
                  >
                    <input
                      ref={(el) => (fileInputRefs.current[requirement.type] = el)}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileChange(e, requirement.type)}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center h-full">
                      {isUploading && uploadingType === requirement.type ? (
                        <>
                          <Upload className="h-6 w-6 animate-spin text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500">Add Photo</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canComplete && (
          <div className="pt-4 border-t">
            <Button onClick={handleComplete} className="w-full">
              Complete {inspectionType === 'exterior' ? 'Exterior' : 'Interior'} Inspection
            </Button>
          </div>
        )}

        {!canComplete && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              Please complete all required photos to proceed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
