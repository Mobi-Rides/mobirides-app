import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PayoutDetailsDialogProps {
  withdrawalId: string | null;
  onClose: () => void;
}

export const PayoutDetailsDialog: React.FC<PayoutDetailsDialogProps> = ({ withdrawalId, onClose }) => {
  return (
    <Dialog open={!!withdrawalId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payout Details</DialogTitle>
        </DialogHeader>
        {/* Payout details content goes here */}
        <div>Payout details for ID: {withdrawalId}</div>
      </DialogContent>
    </Dialog>
  );
};
