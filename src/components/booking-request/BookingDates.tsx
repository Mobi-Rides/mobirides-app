
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface BookingDatesProps {
  startDate: string;
  endDate: string;
}

export const BookingDates = ({ startDate, endDate }: BookingDatesProps) => {
  return (
    <div className="bg-card rounded-lg p-4 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <span className="p-1.5 rounded-full bg-primary/10 dark:bg-primary/20 mr-2">
          <Calendar className="h-4 w-4 text-primary" />
        </span>
        Booking Dates
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-md bg-background">
          <p className="text-sm text-muted-foreground">Start Date</p>
          <p className="font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {format(new Date(startDate), 'PPP')}
          </p>
        </div>
        <div className="p-3 rounded-md bg-background">
          <p className="text-sm text-muted-foreground">End Date</p>
          <p className="font-medium flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {format(new Date(endDate), 'PPP')}
          </p>
        </div>
      </div>
    </div>
  );
};
