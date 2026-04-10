import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  policyId: string | null;
  onClose: () => void;
}

const useInsuranceCoverage = (id: string | null) =>
  useQuery({
    queryKey: ["admin-insurance-coverage", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: policy, error } = await supabase
        .from("insurance_policies")
        .select(`
          id, total_premium, payu_amount, mobirides_commission,
          payu_remittance_status, created_at, booking_id,
          bookings:booking_id (
            id, start_date, end_date, total_price, status,
            cars:car_id (brand, model, year),
            renter:renter_id (full_name)
          )
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return policy;
    },
  });

export const InsuranceCoverageDialog = ({ policyId, onClose }: Props) => {
  const { data, isLoading } = useInsuranceCoverage(policyId);

  return (
    <Dialog open={!!policyId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insurance Coverage Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Policy ID</span>
              <span className="font-mono text-xs">{data.id.substring(0, 12)}…</span>
              <span className="text-muted-foreground">Total Premium</span>
              <span className="font-semibold">BWP {data.total_premium}</span>
              <span className="text-muted-foreground">Pay-U (90%)</span>
              <span>BWP {Number(data.payu_amount).toFixed(2)}</span>
              <span className="text-muted-foreground">Commission (10%)</span>
              <span>BWP {Number(data.mobirides_commission).toFixed(2)}</span>
              <span className="text-muted-foreground">Remittance Status</span>
              <Badge variant="outline">{data.payu_remittance_status}</Badge>
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(data.created_at).toLocaleDateString()}</span>
            </div>
            {data.bookings && (
              <div className="border rounded p-3 space-y-1">
                <p className="font-medium">Covered Booking</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span>{data.bookings.cars ? `${data.bookings.cars.brand} ${data.bookings.cars.model} (${data.bookings.cars.year})` : "—"}</span>
                  <span className="text-muted-foreground">Renter</span>
                  <span>{data.bookings.renter?.full_name || "—"}</span>
                  <span className="text-muted-foreground">Dates</span>
                  <span>{new Date(data.bookings.start_date).toLocaleDateString()} → {new Date(data.bookings.end_date).toLocaleDateString()}</span>
                  <span className="text-muted-foreground">Booking Status</span>
                  <Badge variant="outline" className="text-xs w-fit">{data.bookings.status}</Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-destructive text-sm">Failed to load coverage details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
