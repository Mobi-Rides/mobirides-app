import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Booking } from "@/types/booking";
import { UnifiedPriceSummary } from "./UnifiedPriceSummary";
import { PaymentMethodSelector, PaymentMethodType } from "./PaymentMethodSelector";
import { PaymentDeadlineTimer } from "./PaymentDeadlineTimer";
import { useBookingPayment } from "@/hooks/useBookingPayment";
import { Loader2 } from "lucide-react";

interface RenterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onPaymentSuccess: () => void;
}

export const RenterPaymentModal: React.FC<RenterPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('card');
  const [mobileNumber, setMobileNumber] = useState("");
  
  const { initiatePayment, isProcessing, processingStep } = useBookingPayment({
    onSuccess: () => {
      onPaymentSuccess();
      onClose();
    }
  });

  const handlePay = () => {
    // Calculate derived values if missing from DB
    const days = Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const basePrice = booking.cars.price_per_day * days;
    
    // Fallback logic if new fields are empty (migration support)
    const insurance = 0; // Default to 0 if column not yet populated
    const discount = 0;
    const dynamicAdj = booking.total_price - basePrice - insurance + discount;

    initiatePayment({
      booking_id: booking.id,
      payment_method: selectedMethod,
      mobile_number: selectedMethod === 'orange_money' ? mobileNumber : undefined,
      base_rental_price: basePrice,
      dynamic_pricing_adjustment: dynamicAdj,
      insurance_premium: insurance,
      discount_amount: discount,
      grand_total: booking.total_price
    });
  };

  const getButtonText = () => {
    switch (processingStep) {
      case 'validating': return 'Validating...';
      case 'processing': return 'Processing Payment...';
      case 'confirming': return 'Confirming...';
      case 'complete': return 'Success!';
      default: return `Pay BWP ${booking.total_price.toFixed(2)}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Payment</DialogTitle>
          <DialogDescription>
            {booking.cars.brand} {booking.cars.model} • {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <UnifiedPriceSummary
            basePrice={booking.cars.price_per_day * (Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)}
            pricePerDay={booking.cars.price_per_day}
            numberOfDays={Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1}
            insurancePremium={0} // TODO: Add insurance from booking
            discountAmount={0} // TODO: Add discount from booking
            variant="compact"
            className="bg-muted/30 p-4 rounded-lg"
          />

          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={setSelectedMethod}
          />

          {selectedMethod === 'orange_money' && (
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input
                placeholder="+267 7XXXXXXX"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
          )}

          {/* Fallback deadline if not present in DB yet */}
          <PaymentDeadlineTimer deadline={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()} /> 

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handlePay}
              disabled={isProcessing || (selectedMethod === 'orange_money' && !mobileNumber)}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
