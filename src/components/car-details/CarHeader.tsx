
import { Link } from "react-router-dom";
import { CalendarDays, Info, Edit, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface CarHeaderProps {
  brand: string;
  model: string;
  year: number;
  location: string;
}

export const CarHeader = ({ brand, model, year, location }: CarHeaderProps) => {
  const { id } = useParams<{ id: string }>();
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkOwnership = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        if (!userId || !id) {
          setIsOwner(false);
          return;
        }
        
        // Get car to check ownership
        const { data: carData } = await supabase
          .from("cars")
          .select("owner_id")
          .eq("id", id)
          .single();
          
        setIsOwner(carData?.owner_id === userId);
      } catch (error) {
        console.error("Error checking car ownership:", error);
        setIsOwner(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkOwnership();
  }, [id]);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{brand} {model}</h1>
          <div className="flex items-center mt-1 text-muted-foreground">
            <Badge variant="outline" className="mr-2">{year}</Badge>
            <MapPin className="h-4 w-4 mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            >
              <Link to={`/edit-car/${id}`}>
                <Edit className="h-4 w-4 text-primary" />
                <span className="sr-only">Edit Car Details</span>
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
            asChild
          >
            <Link to="/bookings">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="sr-only">View Bookings</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
