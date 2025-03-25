
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
          <CardHeader className={tabType === "active" ? "pb-2" : undefined}>
            <CardTitle className="text-lg">
              {booking.cars.brand} {booking.cars.model}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Rented by: {booking.renter?.full_name || "Unknown"}
              </p>
              <p className="text-sm">
                From: {format(new Date(booking.start_date), "PPP")}
              </p>
              <p className="text-sm">
                To: {format(new Date(booking.end_date), "PPP")}
              </p>
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
