
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Check, Loader2 } from "lucide-react";

interface EnRouteStepProps {
  title: string;
  description: string;
  onConfirm: () => void;
  isSubmitting: boolean;
  role: "host" | "renter";
}

export const EnRouteStep: React.FC<EnRouteStepProps> = ({
  title,
  description,
  onConfirm,
  isSubmitting,
  role
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 flex flex-col items-center text-center space-y-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Navigation className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-sm">
            {role === "renter" 
              ? "Confirm when you are starting your journey to the handover location."
              : "Confirm when you are heading to the meeting point."}
          </p>
        </div>

        <Button 
          className="w-full h-12 text-lg" 
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Check className="mr-2 h-5 w-5" />
          I'm En Route
        </Button>
      </CardContent>
    </Card>
  );
};
