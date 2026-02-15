
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import { motion } from "framer-motion";

interface WaitingCardProps {
  waitingFor: "host" | "renter" | "both";
  currentStepTitle: string;
}

export const WaitingCard: React.FC<WaitingCardProps> = ({ waitingFor, currentStepTitle }) => {
  const waitingText = waitingFor === "both" 
    ? "Waiting for both parties to complete this step" 
    : `Waiting for ${waitingFor} to complete this step`;

  return (
    <Card className="w-full border-dashed border-2 bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="bg-primary/10 p-4 rounded-full"
        >
          <Clock className="w-10 h-10 text-primary" />
        </motion.div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{currentStepTitle}</h3>
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <p>{waitingText}</p>
          </div>
        </div>

        <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-full bg-primary w-1/3"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-[250px]">
          The screen will update automatically once the {waitingFor} has finished their part.
        </p>
      </CardContent>
    </Card>
  );
};
