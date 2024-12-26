import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Share2, MessageCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import type { Car } from "@/types/car";

const CarDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      console.log("Fetching car details for ID:", id);
      const { data, error } = await supabase
        .from("cars")
        .select(`
          *,
          profiles:owner_id (
            full_name,
            avatar_url
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching car:", error);
        throw error;
      }

      console.log("Car details fetched:", data);
      return data as Car & { profiles: { full_name: string; avatar_url: string | null } };
    },
  });

  const handleSaveCar = async () => {
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to save cars.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("saved_cars")
        .insert({ 
          car_id: id,
          user_id: session.user.id
        });

      if (error) throw error;

      toast({
        title: "Car saved!",
        description: "You can find it in your saved cars list.",
      });
    } catch (error) {
      console.error("Error saving car:", error);
      toast({
        title: "Error",
        description: "Could not save the car. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    navigator.share?.({
      title: `${car?.brand} ${car?.model}`,
      url: window.location.href,
    }).catch((error) => {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Could not share the car details.",
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-4 p-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
        <Navigation />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold text-red-500">Error loading car details</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="space-y-4 p-4">
        <div className="relative">
          <img
            src={car.image_url || "/placeholder.svg"}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-white/80 hover:bg-white"
              onClick={handleSaveCar}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{car.brand} {car.model}</h1>
          <p className="text-muted-foreground">{car.year} • {car.location}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold">BWP {car.price_per_day}</p>
            <p className="text-muted-foreground">per day</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold">{car.transmission}</p>
            <p className="text-muted-foreground">transmission</p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="font-semibold">{car.seats}</p>
            <p className="text-muted-foreground">seats</p>
          </div>
        </div>

        {car.description && (
          <div>
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{car.description}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={car.profiles.avatar_url || "/placeholder.svg"}
              alt={car.profiles.full_name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{car.profiles.full_name}</p>
              <p className="text-sm text-muted-foreground">Car Owner</p>
            </div>
          </div>
          <Button className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Contact Owner
          </Button>
        </div>

        <Button className="w-full" size="lg">
          Book Now
        </Button>
      </div>
      <Navigation />
    </div>
  );
};

export default CarDetails;