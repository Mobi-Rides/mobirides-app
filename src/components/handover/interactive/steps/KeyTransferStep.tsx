
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Check, Loader2 } from "lucide-react";

interface KeyTransferStepProps {
  role: "host" | "renter";
  onComplete: () => void;
  isSubmitting: boolean;
}

export const KeyTransferStep: React.FC<KeyTransferStepProps> = ({
  role,
  onComplete,
  isSubmitting
}) => {
  const isHost = role === "host";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          {isHost ? "Hand Over Keys" : "Receive Keys"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isHost 
            ? "Please hand the physical keys to the renter now." 
            : "Please receive the physical keys from the host."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-primary/5 p-8 rounded-2xl border border-primary/20 flex flex-col items-center text-center space-y-4">
          <div className="bg-primary/10 p-5 rounded-full">
            <Key className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg">{isHost ? "Keys Transferred?" : "Keys Received?"}</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Once the physical exchange is complete, click the button below to confirm.
            </p>
          </div>
        </div>

        <Button 
          className="w-full h-14 text-lg font-bold shadow-lg" 
          onClick={onComplete}
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isHost ? "I Have Handed Over the Keys" : "I Have Received the Keys"}
        </Button>
      </CardContent>
    </Card>
  );
};
