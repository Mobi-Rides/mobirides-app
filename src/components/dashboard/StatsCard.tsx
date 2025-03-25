
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  iconClassName?: string;
}

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
}: StatsCardProps) => {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-4 shadow-sm dark:bg-card dark:border-border", 
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        <div className={cn("rounded-full p-2", iconClassName || "bg-primary/10")}>
          <Icon className={cn("h-4 w-4", iconClassName ? "text-white" : "text-primary")} />
        </div>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
};
