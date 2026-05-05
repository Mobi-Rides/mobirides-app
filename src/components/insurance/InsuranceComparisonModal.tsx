import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { InsuranceComparison } from "./InsuranceComparison";
import { Shield } from "lucide-react";

interface InsuranceComparisonModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dailyRentalAmount: number;
  startDate: Date;
  endDate: Date;
  selectedPackageId?: string | null;
  onSelectPackage: (packageId: string) => void;
  carId?: string;
  renterId?: string;
}

/**
 * InsuranceComparisonModal
 * A dialog wrapper for the InsuranceComparison component
 */
export const InsuranceComparisonModal = ({
  isOpen,
  onOpenChange,
  dailyRentalAmount,
  startDate,
  endDate,
  selectedPackageId,
  onSelectPackage,
  carId,
  renterId,
}: InsuranceComparisonModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Shield className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Compare Protection Packages</DialogTitle>
          </div>
          <DialogDescription>
            Choose the level of protection that's right for your trip. 
            All packages include PayU Botswana underwriting.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <InsuranceComparison
            dailyRentalAmount={dailyRentalAmount}
            startDate={startDate}
            endDate={endDate}
            selectedPackageId={selectedPackageId}
            onSelectPackage={(pkgId) => {
              onSelectPackage(pkgId);
              onOpenChange(false);
            }}
            carId={carId}
            renterId={renterId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsuranceComparisonModal;
