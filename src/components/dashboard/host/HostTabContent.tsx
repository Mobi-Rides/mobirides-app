
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingWithRelations } from "@/types/booking";

interface HostTabContentProps {
  bookings: BookingWithRelations[] | undefined;
  tabType: "active" | "pending" | "completed";
  emptyMessage: string;
  onCardClick: (bookingId: string) => void;
}

export const HostTabContent = ({ 
  bookings, 
  tabType, 
  emptyMessage,
  onCardClick 
}: HostTabContentProps) => {
  const navigate = useNavigate();

  if (!bookings?.length) {
    return (
      <p className="text-muted-foreground text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Card 
          key={booking.id} 
          className="cursor-pointer hover:shadow-md transition-shadow dark:bg-card dark:border-border"
          onClick={() => onCardClick(booking.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{booking.cars.brand} {booking.cars.model}</span>
              <span className="text-sm font-normal px-2 py-1 bg-muted rounded-full">
                {tabType === "active" && "Active"}
                {tabType === "pending" && "Pending"}
                {tabType === "completed" && "Completed"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Rented by: <span className="text-foreground">{booking.renter?.full_name || "Unknown"}</span>
                </p>
                <p className="text-sm font-medium text-primary">
                  BWP {booking.total_price}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="text-sm font-medium">
                    {format(new Date(booking.start_date), "PPP")}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="text-sm font-medium">
                    {format(new Date(booking.end_date), "PPP")}
                  </p>
                </div>
              </div>
              
              {tabType === "completed" && booking.status === "completed" && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/rental-details/${booking.id}?print=true`);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Receipt
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
