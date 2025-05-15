
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RentalDurationCardProps {
  startDate: string;
  endDate: string;
  durationDays: number;
}

export const RentalDurationCard = ({ startDate, endDate, durationDays }: RentalDurationCardProps) => {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
          <Calendar className="h-5 w-5 text-primary dark:text-primary-foreground" />
          Rental Duration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="font-medium">
              {format(new Date(startDate), "PPP")}
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="font-medium">
              {format(new Date(endDate), "PPP")}
            </p>
          </div>
        </div>
        <div className="flex items-center mt-2">
          <Clock className="h-4 w-4 text-muted-foreground mr-2" />
          <span className="text-sm">
            {durationDays} day{durationDays !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
