
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingWithRelations } from "@/types/booking";
import { useIsMobile } from "@/hooks/use-mobile";

interface HostTabContentProps {
  bookings: BookingWithRelations[] | undefined;
  tabType: "active" | "pending" | "completed" | "expired";
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
  const isMobile = useIsMobile();

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
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
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
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "expired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
      case "completed":
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
          <div className="grid grid-cols-[100px_1fr] xs:grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr]">
            <div className="h-full max-h-[100px] xs:max-h-[120px] sm:max-h-none">
              <img 
                src={booking.cars.image_url} 
                alt={`${booking.cars.brand} ${booking.cars.model}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-4">
                <CardTitle className="text-sm sm:text-lg flex items-center justify-between">
                  <span className="truncate pr-2">{booking.cars.brand} {booking.cars.model}</span>
                  <span className={`text-xs font-normal px-2 py-1 rounded-full ${getTypeColor(tabType)}`}>
                    {tabType === "active" && "Active"}
                    {tabType === "pending" && "Pending"}
                    {tabType === "expired" && "Expired"}
                    {tabType === "completed" && "Completed"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Rented by: <span className="text-foreground">{booking.renter?.full_name || "Unknown"}</span>
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-primary">
                      BWP {booking.total_price}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 sm:gap-2 pt-0 sm:pt-1">
                    <div className="bg-muted/50 rounded-md p-1 sm:p-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">From</p>
                      <p className="text-xs sm:text-sm font-medium">
                        {format(new Date(booking.start_date), "PP")}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1 sm:p-2">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">To</p>
                      <p className="text-xs sm:text-sm font-medium">
                        {format(new Date(booking.end_date), "PP")}
                      </p>
                    </div>
                  </div>
                  
                  {tabType === "expired" && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Request expired without response</span>
                    </div>
                  )}
                  
                  {tabType === "completed" && booking.status === "completed" && (
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className="text-xs sm:text-sm h-7 sm:h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rental-details/${booking.id}?print=true`);
                        }}
                      >
                        <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Receipt</span>
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
