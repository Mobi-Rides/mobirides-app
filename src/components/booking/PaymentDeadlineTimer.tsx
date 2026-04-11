import React, { useEffect, useState } from 'react';
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

interface PaymentDeadlineTimerProps {
  deadline: string | Date;
  className?: string;
  variant?: 'full' | 'compact';
}

export const PaymentDeadlineTimer: React.FC<PaymentDeadlineTimerProps> = ({
  deadline,
  className,
  variant = 'full'
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      
      const totalSeconds = differenceInSeconds(deadlineDate, now);

      if (totalSeconds <= 0) {
        setTimeLeft("Expired");
        setUrgency('critical');
        return;
      }

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours < 2) {
        setUrgency('critical');
      } else if (hours < 6) {
        setUrgency('warning');
      } else {
        setUrgency('normal');
      }

      if (variant === 'compact') {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [deadline, variant]);

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm font-medium",
      urgency === 'critical' && "text-destructive animate-pulse",
      urgency === 'warning' && "text-amber-600 dark:text-amber-400",
      urgency === 'normal' && "text-muted-foreground",
      className
    )}>
      <Clock className="h-4 w-4" />
      {variant === 'full' ? (
        <span>Payment deadline: {timeLeft}</span>
      ) : (
        <span>{timeLeft}</span>
      )}
    </div>
  );
};
