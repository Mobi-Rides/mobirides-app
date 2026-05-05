import { useState, useEffect } from "react";
import { Car, Star, MapPin, User, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarPublicUrl } from "@/utils/avatarUtils";
import { useNavigate } from "react-router-dom";
import { Host } from "@/services/hostService";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  view_count?: number;
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
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("owner_id", hostId)
        .eq("is_available", true);

      if (error) throw error;
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching host cars:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCarImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "/placeholder.svg";
    if (imageUrl.startsWith('http')) return imageUrl;
    return supabase.storage.from("car-images").getPublicUrl(imageUrl).data.publicUrl;
  };

  const handleCarClick = (carId: string) => {
    navigate(`/cars/${carId}`);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md overflow-hidden flex flex-col h-full">
          <DrawerHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={getAvatarPublicUrl(host?.avatar_url) || "/placeholder.svg"}
                  alt={host?.full_name || "Host"}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex-1">
                <DrawerTitle className="text-xl font-bold tracking-tight">
                  {host?.full_name || "Host"}'s Fleet
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-1.5 mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-slate-900">4.8</span>
                  <span className="text-slate-500">• 32 reviews</span>
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : cars.length === 0 ? (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-muted/30 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No available cars found</p>
              </div>
            ) : (
              <div className="space-y-4 pb-8">
                {cars.map((car) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={car.id}
                  >
                    <Card
                      className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all active:scale-[0.98]"
                      onClick={() => handleCarClick(car.id)}
                    >
                      <CardContent className="p-0 flex">
                        <div className="w-32 h-32 flex-shrink-0 bg-muted overflow-hidden">
                          <img
                            src={getCarImageUrl(car.image_url)}
                            alt={car.brand}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-start justify-between">
                              <h3 className="font-bold text-sm leading-none">
                                {car.brand} {car.model}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-muted/50" />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                              <Badge variant="outline" className="px-1.5 py-0 rounded text-[9px] uppercase tracking-wider">
                                {car.transmission}
                              </Badge>
                              <span>•</span>
                              <span>{car.seats} Seats</span>
                            </div>
                          </div>

                          <div className="flex items-end justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{car.location}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-0.5">
                                <span className="text-[10px] font-medium text-slate-500">P</span>
                                <span className="text-base font-black text-slate-900">{car.price_per_day}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-bold -mt-1">/DAY</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DrawerFooter className="border-t bg-muted/10">
            <Button variant="outline" onClick={onClose} className="w-full rounded-xl h-12 font-bold">
              Dismiss
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};