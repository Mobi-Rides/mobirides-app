import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  bookingId: string | null;
  onClose: () => void;
}

const useBookingDetails = (id: string | null) =>
  useQuery({
    queryKey: ["admin-booking-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, start_date, end_date, total_price, status, created_at,
          destination_type, pickup_location,
          cars:car_id (brand, model, year, price_per_day, location),
          renter:renter_id (full_name, phone_number),
          payment_transactions (id, amount, status, payment_method, created_at)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

export const BookingDetailsDialog = ({ bookingId, onClose }: Props) => {
  const { data, isLoading } = useBookingDetails(bookingId);

  return (
    <Dialog open={!!bookingId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono text-xs">{data.id}</span>
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{data.status}</Badge>
              <span className="text-muted-foreground">Vehicle</span>
              <span>{data.cars ? `${data.cars.brand} ${data.cars.model} (${data.cars.year})` : "—"}</span>
              <span className="text-muted-foreground">Renter</span>
              <span>{data.renter?.full_name || "—"}</span>
              <span className="text-muted-foreground">Phone</span>
              <span>{data.renter?.phone_number || "—"}</span>
              <span className="text-muted-foreground">Dates</span>
              <span>{new Date(data.start_date).toLocaleDateString()} → {new Date(data.end_date).toLocaleDateString()}</span>
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">P{data.total_price}</span>
              <span className="text-muted-foreground">Pickup</span>
              <span>{data.pickup_location || "—"}</span>
              <span className="text-muted-foreground">Destination type</span>
              <span>{data.destination_type || "—"}</span>
            </div>
            {data.payment_transactions?.length > 0 && (
              <div>
                <p className="font-medium mb-1">Payments</p>
                {data.payment_transactions.map((pt: any) => (
                  <div key={pt.id} className="flex justify-between text-xs border-b py-1">
                    <span className="capitalize">{pt.payment_method || "—"}</span>
                    <span>P{pt.amount}</span>
                    <Badge variant="outline" className="text-xs">{pt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-destructive text-sm">Failed to load booking details.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
