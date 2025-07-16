import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle, CheckCircle, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookingWithRelations } from "@/types/booking";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

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
  const queryClient = useQueryClient();

  if (!bookings?.length) {
    return (
      <p className="text-muted-foreground text-center py-4">
        {emptyMessage}
      </p>
    );
  }

  // Status color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "confirmed":
        return <Badge variant="success" className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="h-3 w-3" /> Confirmed</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case "completed":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" /> Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Cancelled</Badge>;
      case "expired":
        return <Badge variant="outline" className="flex items-center gap-1"><X className="h-3 w-3" /> Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  //B1.2: NEW FUNCTION TO MARK BOOKING AS COMPLETED 
  const handleMarkAsCompleted = async (bookingId: string) => {
    try {
      // Step 1: Update the status in Supabase
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (error) {
        console.error('Error marking booking as completed:', error.message);
        // TODO: Add a toast/notification for error
      } else {
        console.log(`Booking ${bookingId} marked as completed successfully!`);
        // TODO: Add a toast/notification for success

        // Step 2: Invalidate React Query caches to refetch fresh data
        await queryClient.invalidateQueries({ queryKey: ['host-stats'] }); // Update dashboard stats
        await queryClient.invalidateQueries({ queryKey: ['host-bookings'] }); // Update the list of bookings in tabs
      }
    } catch (err) {
      console.error('An unexpected error occurred while marking booking as completed:', err);
      // TODO: Add a generic error toast/notification
    }
  };
  // ------------- //

  // Mobile view - use compact cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {bookings.map((booking) => {
          const today = new Date();
          const endDate = new Date(booking.end_date);
          const showCompleteButton = (tabType === "active" || tabType === "completed") &&
                                     booking.status === "confirmed" &&
                                     endDate < today;
          
          return (
            <Card 
              key={booking.id} 
              className="cursor-pointer hover:shadow-md transition-shadow dark:bg-card dark:border-border overflow-hidden"
              onClick={() => onCardClick(booking.id)}
            >
              <div className="grid grid-cols-[80px_1fr]">
                <div className="h-full max-h-[80px]">
                  <img 
                    src={booking.cars.image_url} 
                    alt={`${booking.cars.brand} ${booking.cars.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm truncate">{booking.cars.brand} {booking.cars.model}</h4>
                    {getStatusBadge(booking.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Rented by: {booking.renter?.full_name || "Unknown"}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-xs">
                      <p>{format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd")}</p>
                      <p className="font-medium text-primary">BWP {booking.total_price}</p>
                    </div>
                    {showCompleteButton && (
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs h-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsCompleted(booking.id);
                        }}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop view - use compact table
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car</TableHead>
            <TableHead>Rented By</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const today = new Date();
            const endDate = new Date(booking.end_date);
            const showCompleteButton = (tabType === "active" || tabType === "completed") &&
                                       booking.status === "confirmed" &&
                                       endDate < today;
            
            return (
              <TableRow 
                key={booking.id}
                className="hover:bg-muted/80 transition-colors cursor-pointer"
                onClick={() => onCardClick(booking.id)}
              >
                <TableCell className="text-left align-top">
                  <div className="flex items-center gap-3">
                    <img
                      src={booking.cars.image_url}
                      alt={`${booking.cars.brand} ${booking.cars.model}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {booking.cars.brand} {booking.cars.model}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.cars.location}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left align-top">
                  <span className="font-medium">{booking.renter?.full_name || 'Unknown'}</span>
                </TableCell>
                <TableCell className="text-left align-top">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(booking.start_date), "yyyy")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-left align-top">
                  {getStatusBadge(booking.status)}
                </TableCell>
                <TableCell className="text-left align-top">
                  <p className="font-medium">BWP {booking.total_price}</p>
                </TableCell>
                <TableCell className="text-right align-top">
                  <div className="flex items-center justify-end gap-2">
                    {showCompleteButton && (
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsCompleted(booking.id);
                        }}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Complete
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/rental-details/${booking.id}?print=true`);
                        }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        Receipt
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/rental-details/${booking.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        {tabType === "pending" && (
                          <DropdownMenuItem onClick={() => navigate(`/booking-requests/${booking.id}`)}>
                            View Request
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
