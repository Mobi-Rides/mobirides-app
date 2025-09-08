import { useState, useEffect } from "react";
import { X, Car, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Host } from "@/services/hostService";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price_per_day: number;
  image_url: string | null;
  vehicle_type: string;
  fuel: string;
  transmission: string;
  seats: number;
  features: string[];
  location: string;
}

interface HostCarsSideTrayProps {
  isOpen: boolean;
  onClose: () => void;
  host: Host | null;
}

export const HostCarsSideTray = ({ isOpen, onClose, host }: HostCarsSideTrayProps) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && host?.id) {
      fetchHostCars(host.id);
    }
  }, [isOpen, host?.id]);

  const fetchHostCars = async (hostId: string) => {
    setLoading(true);
    
    try {
      // Fetch available cars directly from cars table
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("owner_id", hostId)
        .eq("is_available", true);

      if (error) {
        console.error("Error fetching host cars:", error);
        return;
      }

      setCars(data || []);
    } catch (error) {
      console.error("Error in fetchHostCars:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCarImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) {
      console.warn("No image URL provided, using placeholder");
      return "/placeholder.svg";
    }
    
    try {
      // Check if imageUrl is already a full URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // If it's just a storage path, generate the public URL
      const publicUrl = supabase.storage
        .from("car-images")
        .getPublicUrl(imageUrl).data.publicUrl;
      
      return publicUrl;
    } catch (error) {
      console.error("Error processing image URL:", error, "Original URL:", imageUrl);
      return "/placeholder.svg";
    }
  };

  const getHostAvatarUrl = () => {
    if (!host?.avatar_url) return "/placeholder.svg";
    return supabase.storage
      .from("avatars")
      .getPublicUrl(host.avatar_url).data.publicUrl;
  };

  const handleCarClick = (carId: string) => {
    navigate(`/cars/${carId}`);  // ✅ Correct: /cars/ (plural)
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Side Tray */}
      <div className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Host's Cars</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Host Info */}
            {host && (
              <div className="flex items-center gap-3">
                <img
                  src={getHostAvatarUrl()}
                  alt={host.full_name || "Host"}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{host.full_name || "Host"}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">4.8 (32 reviews)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cars List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading cars...</p>
                </div>
              ) : cars.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No available cars</p>
                </div>
              ) : (
                cars.map((car) => (
                  <Card 
                    key={car.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCarClick(car.id)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-video w-full mb-3 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={getCarImageUrl(car.image_url)}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">
                              {car.brand} {car.model}
                            </h3>
                            <p className="text-xs text-muted-foreground">{car.year}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">P{car.price_per_day}</p>
                            <p className="text-xs text-muted-foreground">per day</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{car.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {car.vehicle_type}
                          </Badge>
                          <span className="text-muted-foreground">{car.seats} seats</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{car.transmission}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">4.5 (12)</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};