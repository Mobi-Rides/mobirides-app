
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DualPartyStepCardProps {
  title: string;
  description: string;
  hostCompleted: boolean;
  renterCompleted: boolean;
  children?: React.ReactNode;
}

export const DualPartyStepCard: React.FC<DualPartyStepCardProps> = ({
  title,
  description,
  hostCompleted,
  renterCompleted,
  children
}) => {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
            hostCompleted ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50" : "bg-muted/50 border-transparent"
          )}>
            {hostCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Host</span>
              <span className={cn("text-sm font-semibold", hostCompleted ? "text-green-700 dark:text-green-300" : "text-foreground")}>
                {hostCompleted ? "Confirmed" : "Pending"}
              </span>
            </div>
          </div>

          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
            renterCompleted ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50" : "bg-muted/50 border-transparent"
          )}>
            {renterCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renter</span>
              <span className={cn("text-sm font-semibold", renterCompleted ? "text-green-700 dark:text-green-300" : "text-foreground")}>
                {renterCompleted ? "Confirmed" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        {children && (
          <div className="pt-4 border-t">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
