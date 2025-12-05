import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Star, Loader2 } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/utils/uuid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CarImageManagerProps {
  carId: string;
  mainImageUrl: string | null;
  maxImages?: number;
}

interface CarImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

export const CarImageManager = ({ carId, mainImageUrl, maxImages = 10 }: CarImageManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ["car-images-manager", carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_images")
        .select("*")
        .eq("car_id", carId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Combine main image with additional images
      const allImages: CarImage[] = [];
      
      if (mainImageUrl) {
        allImages.push({
          id: "main",
          image_url: mainImageUrl,
          is_primary: true,
        });
      }

      if (data) {
        allImages.push(...data.map((img) => ({
          id: img.id,
          image_url: img.image_url,
          is_primary: img.is_primary || false,
        })));
      }

      return allImages;
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (imageId === "main") {
        // Update cars table to remove main image
        const { error } = await supabase
          .from("cars")
          .update({ image_url: null })
          .eq("id", carId);
        if (error) throw error;
      } else {
        // Delete from car_images table
        const { error } = await supabase
          .from("car_images")
          .delete()
          .eq("id", imageId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-images-manager", carId] });
      queryClient.invalidateQueries({ queryKey: ["car-images", carId] });
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      toast({ title: "Image deleted successfully" });
    },
    onError: (error) => {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  // Set as primary mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (image: CarImage) => {
      // Update cars table with new main image
      const { error: updateCarError } = await supabase
        .from("cars")
        .update({ image_url: image.image_url })
        .eq("id", carId);

      if (updateCarError) throw updateCarError;

      // If it was in car_images, we can optionally remove it or keep it
      // For now, we'll keep it as a backup
      if (image.id !== "main") {
        await supabase
          .from("car_images")
          .update({ is_primary: true })
          .eq("id", image.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-images-manager", carId] });
      queryClient.invalidateQueries({ queryKey: ["car-images", carId] });
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      toast({ title: "Main photo updated" });
    },
    onError: (error) => {
      console.error("Error setting primary:", error);
      toast({
        title: "Error",
        description: "Failed to update main photo",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Maximum images reached",
        description: `You can only have up to ${maxImages} images`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;

        // Compress image
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 1024,
        });

        // Upload to storage
        const fileExt = compressedFile.name.split(".").pop();
        const fileName = `${generateUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(fileName);

        // If no main image exists, set this as main
        if (!mainImageUrl && images.length === 0) {
          await supabase
            .from("cars")
            .update({ image_url: publicUrl })
            .eq("id", carId);
        } else {
          // Insert into car_images table
          await supabase.from("car_images").insert({
            car_id: carId,
            image_url: publicUrl,
            is_primary: false,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["car-images-manager", carId] });
      queryClient.invalidateQueries({ queryKey: ["car-images", carId] });
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      toast({ title: "Images uploaded successfully" });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error",
        description: "Failed to upload some images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 ${
                index === 0 ? "border-primary" : "border-border"
              }`}
            >
              <img
                src={image.image_url}
                alt={`Car image ${index + 1}`}
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
                    onClick={() => setPrimaryMutation.mutate(image)}
                    disabled={setPrimaryMutation.isPending}
                    title="Set as main photo"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7"
                  onClick={() => setDeleteImageId(image.id)}
                  disabled={deleteMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 border-dashed"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {isUploading
                ? "Uploading..."
                : images.length === 0
                ? "Add Photos (up to 10)"
                : `Add More Photos (${images.length}/${maxImages})`}
            </span>
          </div>
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Click the star icon to set a different main photo. First image will be shown in listings.
      </p>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteImageId} onOpenChange={() => setDeleteImageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteImageId) {
                  deleteMutation.mutate(deleteImageId);
                  setDeleteImageId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
