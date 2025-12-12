import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PromoCode, PromoCodeUsage } from "@/services/promoCodeService";
import { PromoCodeCard } from "./PromoCodeCard";
import { InboxIcon } from "lucide-react";

interface PromoCodeTabsProps {
  availableCodes: PromoCode[];
  usedCodes: PromoCodeUsage[];
  expiredCodes: PromoCode[]; // We might need to fetch these separately or filter availableCodes that are expired if API returns them
}

export const PromoCodeTabs = ({ availableCodes, usedCodes, expiredCodes }: PromoCodeTabsProps) => {
  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <div className="bg-muted p-4 rounded-full mb-3">
        <InboxIcon className="h-8 w-8 opacity-50" />
      </div>
      <p>{message}</p>
    </div>
  );

  return (
    <Tabs defaultValue="available" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="available">Available ({availableCodes.length})</TabsTrigger>
        <TabsTrigger value="used">Used ({usedCodes.length})</TabsTrigger>
        <TabsTrigger value="expired">Expired ({expiredCodes.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="available" className="space-y-4">
        {availableCodes.length > 0 ? (
          availableCodes.map(code => (
            <PromoCodeCard key={code.id} promoCode={code} status="available" />
          ))
        ) : renderEmptyState("No available promo codes at the moment.")}
      </TabsContent>

      <TabsContent value="used" className="space-y-4">
        {usedCodes.length > 0 ? (
          usedCodes.map(usage => (
            <PromoCodeCard 
              key={usage.id} 
              promoCode={usage.promo_codes!} 
              usage={usage} 
              status="used" 
            />
          ))
        ) : renderEmptyState("You haven't used any promo codes yet.")}
      </TabsContent>

      <TabsContent value="expired" className="space-y-4">
        {expiredCodes.length > 0 ? (
          expiredCodes.map(code => (
            <PromoCodeCard key={code.id} promoCode={code} status="expired" />
          ))
        ) : renderEmptyState("No expired promo codes.")}
      </TabsContent>
    </Tabs>
  );
};
