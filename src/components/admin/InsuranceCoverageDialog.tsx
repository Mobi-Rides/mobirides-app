import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface InsuranceCoverageDialogProps {
  policyId: string | null;
  onClose: () => void;
}

export const InsuranceCoverageDialog: React.FC<InsuranceCoverageDialogProps> = ({ policyId, onClose }) => {
  return (
    <Dialog open={!!policyId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insurance Coverage Details</DialogTitle>
        </DialogHeader>
        {/* Insurance coverage content goes here */}
        <div>Insurance coverage for policy ID: {policyId}</div>
      </DialogContent>
    </Dialog>
  );
};
