import { AlertCircle, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStatus } from "@/hooks/useAuthStatus";

export const PaymentRequiredBanner = () => {
  const navigate = useNavigate();
  const { userId } = useAuthStatus();

  const { data: unpaidBookings = [] } = useQuery({
    queryKey: ["unpaid-bookings", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          total_price,
          cars (
            brand,
            model
          )
        `)
        .eq("renter_id", userId)
        .eq("status", "awaiting_payment")
        .eq("payment_status", "unpaid")
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error fetching unpaid bookings:", error);
        return [];
      }
      return data;
    },
    enabled: !!userId,
  });

  if (unpaidBookings.length === 0) return null;

  // Show the most upcoming unpaid booking
  const nextUnpaid = unpaidBookings[0];

  return (
    <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-full">
          <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
              Payment Required
            </h3>
            <span className="px-2 py-0.5 text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 rounded-full font-bold">
              ACTION REQ
            </span>
          </div>
          
          <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
            Your booking for <strong>{nextUnpaid.cars.brand} {nextUnpaid.cars.model}</strong> is approved. Please complete payment to secure your rental.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate(`/rental-details/${nextUnpaid.id}?pay=true`)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white border-none"
            >
              Pay Now (P{nextUnpaid.total_price})
            </Button>
            <Button 
              onClick={() => navigate(`/rental-details/${nextUnpaid.id}`)}
              size="sm"
              variant="ghost"
              className="text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
