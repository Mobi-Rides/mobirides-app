import React, { useEffect, useState } from 'react';
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInHours, differenceInMinutes } from "date-fns";

interface PaymentDeadlineTimerProps {
  deadline: string | Date;
  className?: string;
}

export const PaymentDeadlineTimer: React.FC<PaymentDeadlineTimerProps> = ({
  deadline,
  className
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      
      const hoursLeft = differenceInHours(deadlineDate, now);
      const minutesLeft = differenceInMinutes(deadlineDate, now) % 60;

      if (hoursLeft < 0) {
        setTimeLeft("Expired");
        setUrgency('critical');
        return;
      }

      if (hoursLeft < 2) {
        setUrgency('critical');
      } else if (hoursLeft < 6) {
        setUrgency('warning');
      } else {
        setUrgency('normal');
      }

      setTimeLeft(`${hoursLeft}h ${minutesLeft}m remaining`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm font-medium",
      urgency === 'critical' && "text-destructive animate-pulse",
      urgency === 'warning' && "text-amber-600 dark:text-amber-400",
      urgency === 'normal' && "text-muted-foreground",
      className
    )}>
      <Clock className="h-4 w-4" />
      <span>Payment deadline: {timeLeft}</span>
    </div>
  );
};
