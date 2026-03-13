import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Check, Loader2, Trash2, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { uploadHandoverPhoto } from "@/services/enhancedHandoverService";
import { toast } from "@/utils/toast-utils";

interface VehicleInspectionConsolidatedStepProps {
  handoverSessionId: string;
  handoverType: "pickup" | "return";
  userRole: "host" | "renter";
  onComplete: (data: { photos: string[] }) => void;
  isSubmitting: boolean;
}

const PHOTO_SLOTS = [
  { key: "exterior_front", label: "Front", instruction: "Photograph the front of the vehicle including bumper and headlights" },
  { key: "exterior_back", label: "Rear", instruction: "Photograph the rear including bumper and tail lights" },
  { key: "exterior_left", label: "Left Side", instruction: "Photograph the full left side of the vehicle" },
  { key: "exterior_right", label: "Right Side", instruction: "Photograph the full right side of the vehicle" },
  { key: "dashboard", label: "Dashboard", instruction: "Take a clear photo showing: odometer reading, fuel gauge level, and any warning lights" },
] as const;

export const VehicleInspectionConsolidatedStep: React.FC<VehicleInspectionConsolidatedStepProps> = ({
  handoverSessionId,
  handoverType,
  userRole,
  onComplete,
  isSubmitting,
}) => {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notes, setNotes] = useState("");

  const isInspector =
    (handoverType === "pickup" && userRole === "renter") ||
    (handoverType === "return" && userRole === "host");

  const filledCount = Object.keys(photos).length;
  const canSubmit = filledCount >= 5 && !isSubmitting;

  const handleUpload = async (slot: string, file: File) => {
    setUploadingSlot(slot);
    setUploadProgress(0);
    try {
      const url = await uploadHandoverPhoto(file, handoverSessionId, slot, 3, (p) => setUploadProgress(p));
      if (url) {
        setPhotos((prev) => ({ ...prev, [slot]: url }));
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingSlot(null);
      setUploadProgress(0);
    }
  };

  const removePhoto = (slot: string) => {
    setPhotos((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  // Non-inspector sees read-only waiting state
  if (!isInspector) {
    return (
      <Card className="w-full border-dashed border-2 bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <Camera className="h-10 w-10 text-primary animate-pulse" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Vehicle Inspection</h3>
            <p className="text-sm text-muted-foreground">
              Waiting for the {handoverType === "pickup" ? "renter" : "host"} to complete the vehicle inspection.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Vehicle Inspection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Take clear photos of all required areas. All 5 photos are mandatory.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dashboard photo callout */}
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs">
            The <strong>Dashboard</strong> photo must clearly show the odometer reading, fuel gauge level, and any warning lights or error indicators.
          </AlertDescription>
        </Alert>

        {/* Photo slots */}
        <div className="space-y-3">
          {PHOTO_SLOTS.map(({ key, label, instruction }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
              {photos[key] ? (
                <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0 group">
                  <img src={photos[key]} alt={label} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(key)}
                    className="absolute inset-0 bg-destructive/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4 text-destructive-foreground" />
                  </button>
                </div>
              ) : (
                <div className="relative w-16 h-16 rounded-md border-2 border-dashed flex items-center justify-center bg-muted/40 shrink-0">
                  {uploadingSlot === key ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5 text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(key, f);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  {photos[key] && <Check className="h-3.5 w-3.5 text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">{instruction}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload progress */}
        {uploadingSlot && (
          <div className="space-y-1">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-[10px] text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {/* Progress summary */}
        <div className="text-center text-sm font-medium">
          <span className={filledCount >= 5 ? "text-green-600" : "text-muted-foreground"}>
            {filledCount}/5 photos taken
          </span>
        </div>

        {/* Optional notes */}
        <Textarea
          placeholder="Additional condition notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="resize-none"
          rows={2}
        />

        <Button
          className="w-full h-12 text-lg"
          onClick={() => onComplete({ photos: Object.values(photos) })}
          disabled={!canSubmit}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Check className="mr-2 h-5 w-5" />
          Complete Inspection ({filledCount}/5)
        </Button>
      </CardContent>
    </Card>
  );
};
