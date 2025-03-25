
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "upcoming":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "past":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Card 
          key={booking.id} 
          className="cursor-pointer hover:shadow-md transition-shadow dark:bg-card dark:border-border overflow-hidden"
          onClick={() => onCardClick(booking.id)}
        >
          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr]">
            <div className="h-full">
              <img 
                src={booking.cars.image_url} 
                alt={`${booking.cars.brand} ${booking.cars.model}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{booking.cars.brand} {booking.cars.model}</span>
                  <span className={`text-xs font-normal px-2 py-1 rounded-full ${tabType === "active" ? getTypeColor("active") : getStatusColor(booking.status)}`}>
                    {tabType === "active" ? "Active" : booking.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Location: <span className="text-foreground">{booking.cars.location}</span>
                    </p>
                    <p className="text-sm font-medium text-primary">
                      BWP {booking.total_price}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Pickup</p>
                      <p className="text-sm font-medium">
                        {format(new Date(booking.start_date), "PPP")}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Return</p>
                      <p className="text-sm font-medium">
                        {format(new Date(booking.end_date), "PPP")}
                      </p>
                    </div>
                  </div>
                  
                  {tabType === "past" && booking.status === "completed" && (
                    <div className="flex justify-end pt-1">
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
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
