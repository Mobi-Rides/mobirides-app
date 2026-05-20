import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Car, Download, Receipt } from "lucide-react";
import { format } from "date-fns";
import { BookingWithRelations } from "@/types/booking";
import { UnifiedPriceSummary } from "../booking/UnifiedPriceSummary";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

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
    const receiptNo = booking.id.slice(-8).toUpperCase();
    const exportDate = new Date().toISOString().slice(0, 10);
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('MobiRides Receipt', 105, 18, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Receipt #${receiptNo}`, 105, 25, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(14, 34, 196, 34);

    // Booking details table
    autoTable(doc, {
      startY: 39,
      head: [['Booking Details', '']],
      body: [
        ['Vehicle',         `${booking.cars.brand} ${booking.cars.model}`],
        ['Renter',          booking.renter?.full_name || 'N/A'],
        ['Pickup Location', booking.cars.location || 'Not specified'],
        ['Rental Period',   `${format(new Date(booking.start_date), 'MMM dd, yyyy')} – ${format(new Date(booking.end_date), 'MMM dd, yyyy')}`],
        ['Duration',        `${days} day${days !== 1 ? 's' : ''}`],
        ['Payment Date',    format(new Date(booking.created_at), 'MMM dd, yyyy')],
      ],
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      styles: { fontSize: 10 },
    });

    // Payment summary table
    const paymentRows: [string, string][] = [
      [`Daily Rate × ${days} day${days !== 1 ? 's' : ''}`, `BWP ${basePrice.toFixed(2)}`],
    ];
    if (dynamicPricing) {
      paymentRows.push(['Dynamic Pricing Multiplier', `×${dynamicPricing.multiplier.toFixed(2)}`]);
    }
    if (booking.insurance_premium && booking.insurance_premium > 0) {
      paymentRows.push(['Insurance Premium', `BWP ${booking.insurance_premium.toFixed(2)}`]);
    }
    if (booking.discount_amount && booking.discount_amount > 0) {
      paymentRows.push(['Discount', `-BWP ${booking.discount_amount.toFixed(2)}`]);
    }
    paymentRows.push(['Total Paid', `BWP ${booking.total_price.toFixed(2)}`]);

    const afterDetails = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 10;
    autoTable(doc, {
      startY: afterDetails,
      head: [['Payment Summary', '']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.row.index === paymentRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('MobiRides | support@mobirides.com', 105, 285, { align: 'center' });

    doc.save(`receipt_${receiptNo}_${exportDate}.pdf`);
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
