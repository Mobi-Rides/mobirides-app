
import { Link } from "react-router-dom";
import { CalendarDays, Info, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    <>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">{brand} {model}</h1>
          <p className="text-muted-foreground">{year} • {location}</p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
              className="rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
            >
              <Link to={`/edit-car/${id}`}>
                <Edit className="h-5 w-5 text-primary" />
                <span className="sr-only">Edit Car Details</span>
              </Link>
            </Button>
          )}
          <Link 
            to="/bookings" 
            className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <CalendarDays className="h-5 w-5 text-primary" />
          </Link>
        </div>
      </div>
    </>
  );
};
