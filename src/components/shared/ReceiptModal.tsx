import { format } from "date-fns";
import { 
  Receipt, 
  Calendar, 
  MapPin, 
  User, 
  Car, 
  Download 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingWithRelations } from "@/types/booking";
import { UnifiedPriceSummary } from "../booking/UnifiedPriceSummary";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithRelations;
}

export const ReceiptModal = ({ isOpen, onClose, booking }: ReceiptModalProps) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Future implementation for PDF download
    console.log('Download receipt for booking:', booking.id);
  };

  // Derive calculations if fields missing (migration fallback)
  const days = Math.ceil((new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const pricePerDay = booking.cars.price_per_day;
  const basePrice = booking.base_rental_price ?? (pricePerDay * days);
  
  // Dynamic pricing
  const dynamicPricing = booking.dynamic_pricing_multiplier && booking.dynamic_pricing_multiplier !== 1 ? {
    is_dynamic: true,
    final_price: basePrice * booking.dynamic_pricing_multiplier,
    original_price: basePrice,
    multiplier: booking.dynamic_pricing_multiplier,
    base_price: basePrice,
    total_multiplier: booking.dynamic_pricing_multiplier
  } : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rental Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">MobiRides Receipt</CardTitle>
              <p className="text-center text-muted-foreground">
                Receipt #{booking.id.slice(-8).toUpperCase()}
              </p>
            </CardHeader>
          </Card>

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Rental Period</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.start_date), 'MMM dd, yyyy')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Pickup Location</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.cars.location || 'Location not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Renter</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.renter?.full_name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Vehicle</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.cars.brand} {booking.cars.model}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UnifiedPriceSummary
                basePrice={basePrice}
                pricePerDay={pricePerDay}
                numberOfDays={days}
                dynamicPricing={dynamicPricing}
                insurancePremium={booking.insurance_premium || 0}
                discountAmount={booking.discount_amount || 0}
                variant="receipt"
              />
              <div className="text-sm text-muted-foreground text-center mt-4">
                Payment completed on {format(new Date(booking.created_at), 'MMM dd, yyyy')}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handlePrint}>
              Print Receipt
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};