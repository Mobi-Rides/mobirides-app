
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingWithRelations } from "@/types/booking";

interface RenterTabContentProps {
  bookings: BookingWithRelations[] | undefined;
  tabType: "active" | "upcoming" | "past";
  emptyMessage: string;
  onCardClick: (bookingId: string) => void;
}

export const RenterTabContent = ({
  bookings,
  tabType,
  emptyMessage,
  onCardClick
}: RenterTabContentProps) => {
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
                Location: {booking.cars.location}
              </p>
              <p className="text-sm">
                Pickup: {format(new Date(booking.start_date), "PPP")}
              </p>
              <p className="text-sm">
                Return: {format(new Date(booking.end_date), "PPP")}
              </p>
              {tabType === "upcoming" && (
                <p className="text-sm font-medium">
                  Status: <span className="capitalize">{booking.status}</span>
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {tabType === "past" && booking.status === "completed" && (
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
                )}
                {((tabType === "active") || (tabType === "past" && !booking.reviews?.length)) && (
                  <Button
                    variant="default"
                    size="sm"
                    className="rounded-2xl border-[#8459FB] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/rental-review/${booking.id}`);
                    }}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Review
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
