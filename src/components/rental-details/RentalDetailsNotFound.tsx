
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";

export const RentalDetailsNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Button variant="ghost" className="mb-6" onClick={() => navigate('/bookings')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Rental details not found</h2>
            <p className="text-muted-foreground">The rental information you're looking for could not be found.</p>
            <Button onClick={() => navigate('/bookings')}>View All Bookings</Button>
          </div>
        </CardContent>
      </Card>
      <Navigation />
    </div>
  );
};
