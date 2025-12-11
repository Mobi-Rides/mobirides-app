import { Card, CardContent } from "@/components/ui/card";
import { Ticket, PiggyBank, History } from "lucide-react";

interface PromoCodeSummaryProps {
  availableCount: number;
  usedCount: number;
  totalSavings: number;
}

export const PromoCodeSummary = ({ availableCount, usedCount, totalSavings }: PromoCodeSummaryProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
          <Ticket className="h-5 w-5 text-primary mb-1" />
          <span className="text-2xl font-bold text-primary">{availableCount}</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">Available</span>
        </CardContent>
      </Card>
      
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
          <PiggyBank className="h-5 w-5 text-green-600 mb-1" />
          <span className="text-lg sm:text-xl font-bold text-green-700">P{totalSavings}</span>
          <span className="text-[10px] sm:text-xs text-green-800/70">Total Saved</span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
          <History className="h-5 w-5 text-muted-foreground mb-1" />
          <span className="text-2xl font-bold text-foreground">{usedCount}</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">Used</span>
        </CardContent>
      </Card>
    </div>
  );
};
