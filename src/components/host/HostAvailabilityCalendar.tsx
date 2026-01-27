import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { 
  getCarSchedule,
  blockCarDates, 
  unblockCarDates 
} from "@/services/carAvailabilityService";
import { toast } from "sonner";
import { isSameDay, eachDayOfInterval, parseISO, isBefore, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Calendar as CalendarIcon, Ban, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HostAvailabilityCalendarProps {
  carId: string;
}

export const HostAvailabilityCalendar = ({ carId }: HostAvailabilityCalendarProps) => {
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { bookings, blocked } = await getCarSchedule(carId);

      // Process blocked dates
      setBlockedDates(blocked.map((d: any) => new Date(d.blocked_date)));

      // Process booked dates (expand ranges)
      const allBookedDates: Date[] = [];
      bookings.forEach(booking => {
        const start = parseISO(booking.start_date);
        const end = parseISO(booking.end_date);
        
        try {
          const range = eachDayOfInterval({ start, end });
          allBookedDates.push(...range);
        } catch (e) {
          console.error("Invalid date range in booking:", booking, e);
        }
      });
      setBookedDates(allBookedDates);

    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (carId) {
      fetchData();
    }
  }, [carId]);

  const handleDayClick = async (day: Date, modifiers: any) => {
    // Prevent interaction with past dates
    if (isBefore(day, startOfDay(new Date()))) {
      return;
    }

    // Check if booked
    const isBooked = bookedDates.some(d => isSameDay(d, day));
    if (isBooked) {
      toast.info("This date is booked by a renter and cannot be modified.");
      return;
    }

    // Check if already blocked
    const isBlocked = blockedDates.some(d => isSameDay(d, day));

    try {
      if (isBlocked) {
        // Unblock
        await unblockCarDates(carId, [day]);
        setBlockedDates(prev => prev.filter(d => !isSameDay(d, day)));
        toast.success("Date unblocked - now available for booking");
      } else {
        // Block
        await blockCarDates(carId, [day]);
        setBlockedDates(prev => [...prev, day]);
        toast.success("Date blocked - unavailable for renters");
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update availability");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Availability Calendar
            </CardTitle>
            <CardDescription className="mt-1">
              Manage your car's availability. Tap dates to block or unblock them.
            </CardDescription>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <Calendar
            mode="multiple"
            selected={blockedDates}
            onDayClick={handleDayClick}
            disabled={(date) => isBefore(date, startOfDay(new Date()))}
            modifiers={{
              blocked: blockedDates,
              booked: bookedDates
            }}
            modifiersStyles={{
              blocked: {
                backgroundColor: "hsl(var(--muted))",
                color: "hsl(var(--muted-foreground))",
                textDecoration: "line-through",
                fontWeight: "normal"
              },
              booked: {
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                fontWeight: "bold",
                borderRadius: "100%"
              }
            }}
            className="rounded-md border p-4"
          />

          <div className="flex flex-wrap justify-center gap-4 text-sm w-full pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted border border-border" />
              <span className="text-muted-foreground line-through">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-border bg-background" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-100 opacity-50" />
              <span className="text-muted-foreground">Past</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
