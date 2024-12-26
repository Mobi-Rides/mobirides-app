import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface CarImageCarouselProps {
  carId: string;
  mainImageUrl: string | null;
}

export const CarImageCarousel = ({ carId, mainImageUrl }: CarImageCarouselProps) => {
  const { data: images, isLoading } = useQuery({
    queryKey: ["car-images", carId],
    queryFn: async () => {
      console.log("Fetching images for car:", carId);
      const { data, error } = await supabase
        .from("car_images")
        .select("*")
        .eq("car_id", carId);

      if (error) {
        console.error("Error fetching car images:", error);
        throw error;
      }

      // Combine main image with additional images
      const allImages = mainImageUrl 
        ? [{ id: "main", image_url: mainImageUrl }, ...(data || [])]
        : data || [];

      console.log("Retrieved images:", allImages);
      return allImages;
    },
  });

  if (isLoading) {
    return <Skeleton className="w-full h-64 rounded-lg" />;
  }

  if (!images?.length) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {images.map((image) => (
          <CarouselItem key={image.id}>
            <img
              src={image.image_url}
              alt="Car"
              className="w-full h-64 object-cover rounded-lg"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
};