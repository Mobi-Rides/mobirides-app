
import React, { useState } from "react";
import { Camera, Check, X, Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { uploadHandoverPhoto } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface IdentityVerificationStepProps {
  handoverSessionId: string;
  onComplete: (data: { verified: boolean; photoUrl?: string; notes?: string }) => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const IdentityVerificationStep: React.FC<IdentityVerificationStepProps> = ({
  handoverSessionId,
  onComplete,
  isSubmitting,
  userRole
}) => {
  const [verificationPhoto, setVerificationPhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState("");

  const isHost = userRole === "host";

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const photoUrl = await uploadHandoverPhoto(
        file, 
        handoverSessionId, 
        'identity_verification',
        3,
        (progress) => setUploadProgress(progress)
      );
      
      if (photoUrl) {
        setVerificationPhoto(photoUrl);
      }
    } catch (error) {
      toast.error("Failed to upload verification photo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Identity Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          As the host, please verify the renter's identity by taking a photo of them with their ID.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verificationPhoto ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center space-y-4 bg-muted/30">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Take a photo of the renter</p>
              <p className="text-xs text-muted-foreground">Ensure their face and ID are clearly visible</p>
            </div>
            <div className="relative inline-block">
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <Button disabled={isUploading} className="flex items-center gap-2">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Capture Photo
              </Button>
            </div>
            
            {isUploading && (
              <div className="space-y-2 pt-2">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-[10px] text-muted-foreground">Uploading... {uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border aspect-video bg-muted">
              <img
                src={verificationPhoto}
                alt="Verification"
                className="w-full h-full object-cover"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={() => setVerificationPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes about the identity verification..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px] text-sm"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => onComplete({ verified: true, photoUrl: verificationPhoto, notes })}
                disabled={isSubmitting}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                Verify & Continue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
