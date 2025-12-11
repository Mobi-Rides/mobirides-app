import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePromoCodeHistory } from "@/hooks/usePromoCodeHistory";
import { PromoCodeSummary } from "@/components/promo/PromoCodeSummary";
import { PromoCodeTabs } from "@/components/promo/PromoCodeTabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function PromoCodeHistory() {
  const navigate = useNavigate();
  const { availableCodes, usedCodes, totalSavings, isLoading, refetch } = usePromoCodeHistory();

  // In a real implementation, we would fetch expired codes separately or filter them.
  // For now, we assume `availableCodes` hook might filter them out, so we pass empty or derived list.
  // But let's say we want to show expired ones if we had them. 
  // The service `getAvailablePromoCodes` currently filters out expired ones.
  // We'll pass empty for now as we don't fetch expired history specifically yet.
  const expiredCodes: any[] = []; 

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="container max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Rewards & Discounts</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="container max-w-lg mx-auto p-4 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : (
          <>
            <PromoCodeSummary 
              availableCount={availableCodes.length} 
              usedCount={usedCodes.length} 
              totalSavings={totalSavings} 
            />
            
            <PromoCodeTabs 
              availableCodes={availableCodes} 
              usedCodes={usedCodes} 
              expiredCodes={expiredCodes} 
            />
          </>
        )}
      </div>
    </div>
  );
}
