import { useState } from "react";
import { addDays, differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ExtensionRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bookingId: string;
  currentEndDate: string;
  pricePerDay: number;
}

export function ExtensionRequestDialog({
  open, onClose, onSuccess, bookingId, currentEndDate, pricePerDay
}: ExtensionRequestDialogProps) {
  const [extraDays, setExtraDays] = useState(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const newEndDate = addDays(new Date(currentEndDate), extraDays);
  const additionalCost = extraDays * pricePerDay;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("booking_extensions" as any)
        .insert({
          booking_id: bookingId,
          requested_by: user.id,
          current_end_date: currentEndDate,
          requested_end_date: format(newEndDate, "yyyy-MM-dd"),
          additional_days: extraDays,
          additional_cost: additionalCost,
          reason: reason || null,
        });

      if (error) throw error;

      toast.success("Extension request sent to host");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit extension request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Extend Rental</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">Additional days</label>
            <div className="flex items-center gap-3 mt-1">
              <Button variant="outline" size="sm" onClick={() => setExtraDays(d => Math.max(1, d - 1))}>−</Button>
              <span className="w-8 text-center font-semibold">{extraDays}</span>
              <Button variant="outline" size="sm" onClick={() => setExtraDays(d => d + 1)}>+</Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-1">
            <p>New end date: <span className="font-medium text-foreground">{format(newEndDate, "MMM d, yyyy")}</span></p>
            <p>Additional cost: <span className="font-medium text-foreground">P{additionalCost.toFixed(2)}</span></p>
          </div>

          <div>
            <label className="text-sm font-medium">Reason (optional)</label>
            <Textarea
              className="mt-1"
              placeholder="Let the host know why you need more time..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
