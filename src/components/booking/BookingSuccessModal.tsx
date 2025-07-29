import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MapPin, Clock } from "lucide-react";
import { BookingBreadcrumbs } from "./BookingBreadcrumbs";
import { useNavigate } from "react-router-dom";

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData?: {
    id: string;
    carBrand: string;
    carModel: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  };
}

export const BookingSuccessModal = ({
  isOpen,
  onClose,
  bookingData,
}: BookingSuccessModalProps) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleViewBookings();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleViewBookings = () => {
    onClose();
    navigate("/bookings");
  };

  const handleCloseModal = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <BookingBreadcrumbs currentStep="success" bookingId={bookingData?.id} />
        
        <div className="p-6">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">
              Booking Request Submitted!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Booking Details
              </h3>
              
              {bookingData && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {bookingData.carBrand} {bookingData.carModel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        BWP {bookingData.totalPrice}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Rental Period</p>
                      <p className="text-sm text-muted-foreground">
                        {bookingData.startDate} to {bookingData.endDate}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                What happens next?
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>• The car owner will review your request</li>
                <li>• You'll be notified once it's approved</li>
                <li>• Pickup details will be shared via messages</li>
                <li>• Handover process will be available on booking day</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={handleViewBookings}
                className="flex-1"
              >
                View My Bookings {countdown > 0 && `(${countdown}s)`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};