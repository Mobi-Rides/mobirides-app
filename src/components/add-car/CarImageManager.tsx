import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Star, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { compressImage } from "@/utils/imageCompression";
import { useToast } from "@/hooks/use-toast";
import { generateUUID } from "@/utils/uuid";
import { getCarImagePublicUrl } from "@/utils/carImageUtils";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";

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
  const [replaceImageId, setReplaceImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
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

      const allImages: CarImage[] = [];
      const seenUrls = new Set<string>();

      // Standardize the main URL for comparison
      const mainUrlNormalized = mainImageUrl ? getCarImagePublicUrl(mainImageUrl) : null;

      if (mainImageUrl && mainUrlNormalized) {
        allImages.push({
          id: "main",
          image_url: mainImageUrl,
          is_primary: true,
        });
        seenUrls.add(mainUrlNormalized);
      }

      if (data) {
        data.forEach((img) => {
          const urlNormalized = getCarImagePublicUrl(img.image_url);
          // Deduplicate: Don't add if it's the main image or already seen
          if (urlNormalized && !seenUrls.has(urlNormalized)) {
            allImages.push({
              id: img.id,
              image_url: img.image_url,
              is_primary: img.is_primary || false,
            });
            seenUrls.add(urlNormalized);
          }
        });
      }

      return allImages;
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      if (imageId === "main") {
        const { error } = await supabase
          .from("cars")
          .update({ image_url: null })
          .eq("id", carId);
        if (error) throw error;
      } else {
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
      // 1. First, update the cars table to ensure the listing has a cover
      const { error: updateCarError } = await supabase
        .from("cars")
        .update({ image_url: image.image_url })
        .eq("id", carId);

      if (updateCarError) throw updateCarError;

      // 2. Unset any existing primary in car_images for this specific car
      // We do this BEFORE setting the new one to avoid unique constraint violation
      const { error: unsetError } = await supabase
        .from("car_images")
        .update({ is_primary: false })
        .eq("car_id", carId)
        .eq("is_primary", true);

      if (unsetError) {
        console.warn("Could not unset existing primary images, continuing anyway...", unsetError);
      }

      // 3. Set the new primary in car_images
      if (image.id !== "main") {
        const { error: setError } = await supabase
          .from("car_images")
          .update({ is_primary: true })
          .eq("id", image.id);

        if (setError) {
          console.error("Error setting primary in car_images:", setError);
          throw setError;
        }
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

  // Replace image mutation
  const replaceMutation = useMutation({
    mutationFn: async ({ file, imageId }: { file: File, imageId: string }) => {
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        maxSizeKB: 1024,
      });

      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `${generateUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("car-images")
        .getPublicUrl(fileName);

      if (imageId === "main") {
        const { error } = await supabase
          .from("cars")
          .update({ image_url: publicUrl })
          .eq("id", carId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("car_images")
          .update({ image_url: publicUrl })
          .eq("id", imageId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-images-manager", carId] });
      queryClient.invalidateQueries({ queryKey: ["car-images", carId] });
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      toast({ title: "Image replaced successfully" });
    },
    onError: (error) => {
      console.error("Replace error:", error);
      toast({
        title: "Error",
        description: "Failed to replace image",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setReplaceImageId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
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
      let currentMainUrl = mainImageUrl;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) continue;

        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 1024,
        });

        const fileExt = compressedFile.name.split(".").pop();
        const fileName = `${generateUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(fileName, compressedFile);

        if (uploadError) continue;

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(fileName);

        // Check if we need to set a primary image
        // We set as primary if there is no main cover photo in the cars table currently
        // and no image in the existing list is marked primary.
        const hasExistingPrimary = images.some(img => img.is_primary);
        const shouldBePrimary = !currentMainUrl && !hasExistingPrimary;

        if (shouldBePrimary) {
          // Update cars table
          await supabase
            .from("cars")
            .update({ image_url: publicUrl })
            .eq("id", carId);

          // Insert into car_images as primary
          await supabase.from("car_images").insert({
            car_id: carId,
            image_url: publicUrl,
            is_primary: true,
          });

          // Set local flag to skip other images in this loop if multiple files
          currentMainUrl = publicUrl;
        } else {
          // Insert into car_images table as normal
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
      toast({ title: "Error", description: "Failed to upload some images", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceImageId) {
            replaceMutation.mutate({ file, imageId: replaceImageId });
          }
        }}
        className="hidden"
      />

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border transition-all duration-300",
                image.id === "main" ? "ring-2 ring-primary ring-offset-2" : "hover:border-primary/50"
              )}
            >
              <img
                src={getCarImagePublicUrl(image.image_url)}
                alt={`Car image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Status Badge */}
              {image.id === "main" && (
                <div className="absolute top-2 left-2 z-10">
                  <span className="flex items-center gap-1 bg-primary px-2 py-1 rounded-full text-[10px] font-bold text-primary-foreground shadow-lg animate-in fade-in zoom-in duration-300">
                    <CheckCircle2 className="w-3 h-3" />
                    COVER PHOTO
                  </span>
                </div>
              )}

              {/* Glassmorphism Action Menu */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-2">
                <div className="flex gap-2">
                  {image.id !== "main" && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-9 w-9 bg-white/20 backdrop-blur-md border-white/30 hover:bg-primary hover:text-white transition-colors"
                      onClick={() => setPrimaryMutation.mutate(image)}
                      disabled={setPrimaryMutation.isPending}
                      title="Set as cover"
                    >
                      <Star className={cn("h-4 w-4", image.id === "main" && "fill-current")} />
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9 bg-white/20 backdrop-blur-md border-white/30 hover:bg-blue-500 hover:text-white transition-colors"
                    onClick={() => {
                      setReplaceImageId(image.id);
                      replaceInputRef.current?.click();
                    }}
                    disabled={replaceMutation.isPending}
                    title="Replace image"
                  >
                    <RefreshCw className={cn("h-4 w-4", replaceMutation.isPending && "animate-spin")} />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9 bg-red-500/20 backdrop-blur-md border-red-500/30 hover:bg-red-500 transition-colors"
                    onClick={() => setDeleteImageId(image.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Loading Overlay for this specific image */}
              {(replaceMutation.isPending && replaceImageId === image.id) && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Add More Button inside the grid */}
          {images.length < maxImages && (
            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative aspect-[4/3] rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-2 overflow-hidden"
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
              ) : (
                <>
                  <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <ImagePlus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-medium text-muted-foreground group-hover:text-primary">
                      Add Photos
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {images.length} / {maxImages}
                    </span>
                  </div>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <Star className="w-3 h-3 text-primary fill-primary" />
          Click the star icon to set the cover photo. The first image is used for listings.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteImageId} onOpenChange={() => setDeleteImageId(null)}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-lg border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This image will be permanently removed from the car carousel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted hover:bg-muted/80">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 border-none"
              onClick={() => {
                if (deleteImageId) {
                  deleteMutation.mutate(deleteImageId);
                  setDeleteImageId(null);
                }
              }}
            >
              Remove Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
