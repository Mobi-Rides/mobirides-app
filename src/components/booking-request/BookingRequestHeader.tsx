
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card";

interface BookingRequestHeaderProps {
  status: string;
}

export const BookingRequestHeader = ({ status }: BookingRequestHeaderProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <CardHeader className="bg-primary/5 dark:bg-primary/10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-primary-foreground">
          Booking Request Details
        </h1>
        <Badge className={getStatusColor(status)}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
    </CardHeader>
  );
};
