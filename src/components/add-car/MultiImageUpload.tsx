import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { useToast } from "@/hooks/use-toast";

interface MultiImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
}

export const MultiImageUpload = ({ onImagesChange, maxImages = 10 }: MultiImageUploadProps) => {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - previews.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only upload up to ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsCompressing(true);

    try {
      const newPreviews: { file: File; url: string }[] = [];

      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image`,
            variant: "destructive",
          });
          continue;
        }

        // Compress image before adding
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 1024,
        });

        const url = URL.createObjectURL(compressedFile);
        newPreviews.push({ file: compressedFile, url });
      }

      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      onImagesChange(updatedPreviews.map((p) => p.file));
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Error",
        description: "Failed to process some images",
        variant: "destructive",
      });
    } finally {
      setIsCompressing(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    const removed = previews[index];
    URL.revokeObjectURL(removed.url);
    
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onImagesChange(updatedPreviews.map((p) => p.file));
  };

  const moveToFirst = (index: number) => {
    if (index === 0) return;
    
    const updatedPreviews = [...previews];
    const [item] = updatedPreviews.splice(index, 1);
    updatedPreviews.unshift(item);
    
    setPreviews(updatedPreviews);
    onImagesChange(updatedPreviews.map((p) => p.file));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div
              key={preview.url}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 ${
                index === 0 ? "border-primary" : "border-border"
              }`}
            >
              <img
                src={preview.url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main Photo
                </span>
              )}
              
              {/* Action buttons */}
              <div className="absolute top-2 right-2 flex gap-1">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7"
                    onClick={() => moveToFirst(index)}
                    title="Set as main photo"
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {previews.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
        >
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isCompressing
                ? "Processing..."
                : previews.length === 0
                ? "Add Photos (up to 10)"
                : `Add More Photos (${previews.length}/${maxImages})`}
            </span>
          </div>
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        First image will be the main photo. Click the star icon to change.
      </p>
    </div>
  );
};
