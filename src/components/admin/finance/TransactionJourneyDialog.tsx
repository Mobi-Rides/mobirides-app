import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Circle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionJourneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  paymentTransactionId?: string;
}

interface JourneyStep {
  label: string;
  status: "complete" | "pending" | "failed" | "skipped";
  detail: string;
  timestamp?: string;
}

const useTransactionJourney = (bookingId: string | null) => {
  return useQuery({
    queryKey: ["transaction-journey", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      // Fetch booking with car and renter info
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (brand, model, owner_id),
          profiles!bookings_renter_id_fkey (full_name)
        `)
        .eq("id", bookingId)
        .single();

      if (bookingErr) throw bookingErr;

      // Fetch wallet transactions for this booking
      const { data: walletTxns } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      // Fetch payment transaction if linked
      let paymentTxn = null;
      if (booking.payment_transaction_id) {
        const { data } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("id", booking.payment_transaction_id)
          .single();
        paymentTxn = data;
      }

      // Fetch commission rate
      const { data: commissionRate } = await supabase
        .from("commission_rates")
        .select("rate")
        .order("effective_from", { ascending: false })
        .limit(1)
        .single();

      return { booking, walletTxns: walletTxns || [], paymentTxn, commissionRate };
    },
    enabled: !!bookingId,
  });
};

const StepIcon = ({ status }: { status: JourneyStep["status"] }) => {
  switch (status) {
    case "complete":
      return <Check className="h-4 w-4 text-green-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "pending":
      return <Clock className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
};

export const TransactionJourneyDialog: React.FC<TransactionJourneyDialogProps> = ({
  isOpen,
  onClose,
  bookingId,
}) => {
  const { data, isLoading } = useTransactionJourney(bookingId);

  const buildSteps = (): JourneyStep[] => {
    if (!data?.booking) return [];
    const { booking, paymentTxn, walletTxns, commissionRate } = data;
    const rate = commissionRate?.rate ?? 0.15;

    const steps: JourneyStep[] = [];

    // 1. Booking Created
    steps.push({
      label: "Booking Created",
      status: "complete",
      detail: `${(booking.profiles as any)?.full_name || "Renter"} booked ${booking.cars?.brand} ${booking.cars?.model} • BWP ${booking.total_price}`,
      timestamp: booking.created_at,
    });

    // 2. Host Approved
    const wasApproved = ["awaiting_payment", "confirmed", "completed"].includes(booking.status);
    steps.push({
      label: "Host Approved",
      status: wasApproved ? "complete" : booking.status === "cancelled" ? "failed" : "pending",
      detail: wasApproved
        ? "Host approved → status set to awaiting_payment"
        : booking.status === "cancelled"
        ? "Booking was cancelled"
        : "Waiting for host approval",
      timestamp: wasApproved ? booking.updated_at : undefined,
    });

    // 3. Payment Initiated
    const paymentInitiated = !!paymentTxn;
    steps.push({
      label: "Payment Initiated",
      status: paymentInitiated ? "complete" : wasApproved && booking.status === "awaiting_payment" ? "pending" : wasApproved ? "complete" : "skipped",
      detail: paymentInitiated
        ? `${paymentTxn.payment_method.replace("_", " ")} via ${paymentTxn.payment_provider}`
        : booking.status === "awaiting_payment"
        ? "Awaiting renter payment"
        : wasApproved ? "Payment processed" : "—",
      timestamp: paymentTxn?.created_at,
    });

    // 4. Payment Confirmed
    const paymentConfirmed = paymentTxn?.status === "completed" || booking.payment_status === "paid";
    steps.push({
      label: "Payment Confirmed",
      status: paymentConfirmed ? "complete" : paymentTxn?.status === "failed" ? "failed" : paymentInitiated ? "pending" : "skipped",
      detail: paymentConfirmed
        ? `BWP ${booking.total_price} received${paymentTxn?.provider_reference ? ` • Ref: ${paymentTxn.provider_reference}` : ""}`
        : paymentTxn?.status === "failed"
        ? "Payment failed"
        : "—",
      timestamp: paymentConfirmed ? paymentTxn?.updated_at : undefined,
    });

    // 5. Commission Deducted
    const commissionTxn = walletTxns.find((t: any) => t.transaction_type === "commission" || t.description?.toLowerCase().includes("commission"));
    const commissionAmount = booking.commission_amount || (booking.total_price * rate);
    steps.push({
      label: "Commission Deducted",
      status: commissionTxn || booking.commission_status === "deducted" ? "complete" : paymentConfirmed ? "pending" : "skipped",
      detail: commissionTxn || booking.commission_status
        ? `${(rate * 100).toFixed(0)}% = BWP ${commissionAmount.toFixed(2)}`
        : "—",
      timestamp: commissionTxn?.created_at,
    });

    // 6. Host Wallet Credited
    const creditTxn = walletTxns.find((t: any) => t.transaction_type === "booking_earning" || t.transaction_type === "earning" || t.description?.toLowerCase().includes("earning"));
    const hostEarnings = booking.total_price - commissionAmount;
    steps.push({
      label: "Host Wallet Credited",
      status: creditTxn ? "complete" : paymentConfirmed ? "pending" : "skipped",
      detail: creditTxn
        ? `BWP ${hostEarnings.toFixed(2)} credited to host wallet`
        : paymentConfirmed
        ? `BWP ${hostEarnings.toFixed(2)} pending credit`
        : "—",
      timestamp: creditTxn?.created_at,
    });

    // 7. Earnings Released
    const isCompleted = booking.status === "completed";
    const endDate = new Date(booking.actual_end_date || booking.end_date);
    const releaseDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    const isReleased = isCompleted && new Date() > releaseDate;
    steps.push({
      label: "Earnings Released",
      status: isReleased ? "complete" : isCompleted ? "pending" : "skipped",
      detail: isReleased
        ? `Funds available for withdrawal`
        : isCompleted
        ? `Pending — releases on ${releaseDate.toLocaleDateString()}`
        : "—",
      timestamp: isReleased ? releaseDate.toISOString() : undefined,
    });

    return steps;
  };

  const steps = buildSteps();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Journey</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                {/* Vertical line */}
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-3 top-6 w-0.5 h-full -translate-x-1/2",
                      step.status === "complete" ? "bg-green-300 dark:bg-green-700" : "bg-border"
                    )}
                  />
                )}
                {/* Icon */}
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full border-2 shrink-0 z-10 bg-background",
                  step.status === "complete" && "border-green-500",
                  step.status === "failed" && "border-destructive",
                  step.status === "pending" && "border-amber-400",
                  step.status === "skipped" && "border-muted"
                )}>
                  <StepIcon status={step.status} />
                </div>
                {/* Content */}
                <div className="pb-6 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{step.label}</span>
                    {step.status === "pending" && (
                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                    )}
                    {step.status === "failed" && (
                      <Badge variant="destructive" className="text-xs">Failed</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                  {step.timestamp && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {new Date(step.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
