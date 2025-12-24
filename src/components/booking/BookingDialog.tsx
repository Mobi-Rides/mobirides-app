import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "@/types/car";
import { AlertCircle, CalendarX, MapPin } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleExpiredBookings } from "@/services/bookingService";
import {
  checkCarAvailability,
  getBookedDates,
  isDateUnavailable,
} from "@/services/availabilityService";
import { BookingStatus } from "@/types/booking";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { VerificationRequiredDialog } from "@/components/verification/VerificationRequiredDialog";
import { BookingLocationPicker } from "./BookingLocationPicker";
import { BookingBreadcrumbs } from "./BookingBreadcrumbs";
import { BookingSuccessModal } from "./BookingSuccessModal";
import { useDynamicPricing } from "@/hooks/useDynamicPricing";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { PriceBreakdown } from "./PriceBreakdown";
import { InsurancePackageSelector } from "@/components/insurance/InsurancePackageSelector";
import { InsuranceService } from "@/services/insuranceService";
import { PromoCodeInput } from "@/components/promo/PromoCodeInput";
import {
  validatePromoCode,
  applyPromoCode,
  calculateDiscount,
  PromoCode
} from "@/services/promoCodeService";

interface BookingDialogProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingDialog = ({ car, isOpen, onClose }: BookingDialogProps) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isLoading, setIsLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successBookingData, setSuccessBookingData] = useState<{
    id: string;
    carBrand: string;
    carModel: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
  } | null>(null);
  const mountedRef = useRef(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isVerified, isLoading: isVerificationLoading } =
    useVerificationStatus();

  // Promo Code State
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const basePrice = useMemo(() => {
    if (!startDate || !endDate) return undefined;
    const numberOfDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    return numberOfDays * car.price_per_day;
  }, [startDate, endDate, car.price_per_day]);

  const { calculation, finalPrice, loading: dpLoading } = useDynamicPricing(
    car.id,
    basePrice,
    startDate,
    endDate,
    pickupLocation?.latitude,
    pickupLocation?.longitude,
    userId ?? undefined,
  );

  const [selectedInsurancePackageId, setSelectedInsurancePackageId] = useState<string | null>(null);
  const [insurancePremium, setInsurancePremium] = useState<number | null>(null);

  // Calculate prices for display and booking
  const priceBeforeDiscount = isFeatureEnabled("DYNAMIC_PRICING") && finalPrice ? finalPrice : basePrice || 0;
  const discountAmount = appliedPromo ? calculateDiscount(appliedPromo, priceBeforeDiscount) : 0;
  const totalDisplayPrice = Math.max(0, priceBeforeDiscount - discountAmount);

  const handlePromoApplied = (promo: PromoCode) => {
    setAppliedPromo(promo);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  // Check if the current user is the car owner
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUserId = data.session?.user?.id;

      if (!mountedRef.current) return;

      setUserId(currentUserId);

      if (currentUserId && car.owner_id === currentUserId) {
        setIsOwner(true);
      }
    };

    checkAuth();
  }, [car.owner_id]);

  // Fetch booked dates when dialog opens
  useEffect(() => {
    if (isOpen && car.id) {
      const fetchBookedDates = async () => {
        const dates = await getBookedDates(car.id);
        setBookedDates(dates);
      };

      fetchBookedDates();
      handleExpiredBookings().catch(console.error);
    }
  }, [isOpen, car.id]);

  // Check availability whenever date range changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (startDate && endDate && car.id) {
        setIsCheckingAvailability(true);
        try {
          const available = await checkCarAvailability(
            car.id,
            startDate,
            endDate,
          );
          console.log('BookingDialog: Availability check result', available);
          setIsAvailable(available);
        } catch (error) {
          console.error("Error checking availability:", error);
          setIsAvailable(false);
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    };

    if (startDate && endDate) {
      checkAvailability();
    } else {
      setIsAvailable(true);
    }
  }, [startDate, endDate, car.id]);

  useEffect(() => {
    let isMounted = true;

    if (isOpen) {
      handleExpiredBookings().catch(console.error);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Set default pickup location from car's location
  useEffect(() => {
    console.log('BookingDialog: Setting default location from car', { carLatitude: car.latitude, carLongitude: car.longitude });
    if (car.latitude && car.longitude) {
      setPickupLocation({
        latitude: car.latitude,
        longitude: car.longitude,
      });
    }
  }, [car]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const createNotification = async (
    userId: string,
    type: "booking_request", // Use string literal for DB compatibility
    content: string,
    carId: string,
    bookingId: string,
  ) => {
    console.log("Creating notification:", {
      userId,
      type,
      content,
      carId,
      bookingId,
    });
    // Use the database function instead of direct insert to avoid schema mismatches
    const { error } = await supabase.rpc('create_booking_notification', {
      p_booking_id: bookingId,
      p_notification_type: 'booking_request',
      p_content: content
    });


    if (error) {
      console.error(
        "Error creating notification:",
        error.message || JSON.stringify(error, null, 2),
      );
      // Don't throw error to prevent blocking the booking flow
      return false;
    }
    return true;
  };

  const handleBooking = async () => {
    // Check session validity first
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session?.user) {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue with your booking",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Check verification status
    if (!isVerified && !isVerificationLoading) {
      setIsVerificationDialogOpen(true);
      return;
    }

    // Prevent car owners from booking their own cars
    if (isOwner) {
      toast({
        title: "Not allowed",
        description: "You cannot book your own car",
        variant: "destructive",
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }

    const available = await checkCarAvailability(car.id, startDate, endDate);
    if (!available) {
      toast({
        title: "Not available",
        description:
          "This car is not available for the selected dates. Please choose different dates.",
      });
      return;
    }

    if (!pickupLocation) {
      toast({
        title: "Error",
        description: "Please select a pickup location",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
        toast({
          title: "Timeout",
          description:
            "Booking is taking longer than expected. Please check your bookings page.",
          variant: "destructive",
        });
      }
    }, 30000); // 30 second timeout

    try {
      console.log("[BookingDialog] Starting booking process...");

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("No authenticated user");

      // Use the pre-calculated prices from component scope
      let totalPrice = priceBeforeDiscount;
      let discountValue = 0;

      if (appliedPromo) {
        discountValue = calculateDiscount(appliedPromo, priceBeforeDiscount);
        totalPrice = priceBeforeDiscount - discountValue;
      }

      console.log("[BookingDialog] Creating booking in database...");

      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          car_id: car.id,
          renter_id: session.session.user.id,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          start_time: startTime,
          end_time: endTime,
          total_price: totalPrice,
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          status: "pending", // Explicitly set status to a valid enum value
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create insurance policy if selected
      if (selectedInsurancePackageId) {
        try {
          const insurancePackage = await InsuranceService.getPackageById(selectedInsurancePackageId);

          // Only create policy if not "no_coverage" (assuming no_coverage might be a package ID or we check name)
          // The selector returns a package ID. getPackageById will return the package details.
          if (insurancePackage.name !== 'no_coverage') {
            console.log("[BookingDialog] Creating insurance policy...");

            // Construct dates with time components to ensure end_date > start_date
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);

            const policyStartDate = new Date(startDate);
            policyStartDate.setHours(startHour, startMinute, 0, 0);

            const policyEndDate = new Date(endDate);
            policyEndDate.setHours(endHour, endMinute, 0, 0);

            await InsuranceService.createPolicy(
              booking.id,
              selectedInsurancePackageId,
              session.session.user.id,
              car.id,
              policyStartDate,
              policyEndDate,
              car.price_per_day
            );
            console.log("[BookingDialog] Insurance policy created successfully");
          }
        } catch (insuranceError) {
          console.error("[BookingDialog] Failed to create insurance policy:", insuranceError);
          // Non-blocking for booking flow, but should be logged/alerted
          toast({
            title: "Warning",
            description: "Booking successful, but insurance policy creation failed. Please contact support.",
            variant: "destructive"
          });
        }
      }

      // Apply promo code usage if applicable
      if (appliedPromo) {
        try {
          await applyPromoCode(
            appliedPromo.id,
            session.session.user.id,
            booking.id,
            discountValue,
            priceBeforeDiscount,
            totalPrice
          );
          console.log("[BookingDialog] Promo code usage recorded");
        } catch (promoError) {
          console.error("[BookingDialog] Failed to record promo usage:", promoError);
          // Non-blocking for booking flow, but should be logged
          toast({
            title: "Warning",
            description: "Booking successful, but promo code application failed. Please contact support.",
            variant: "destructive"
          });
        }
      }

      console.log("[BookingDialog] Booking created successfully:", booking.id);
      console.log("[BookingDialog] Creating notifications and sending Twilio alerts...");

      // Get user details for notifications (using existing columns for now)
      const { data: renterProfile } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", session.session.user.id)
        .single();

      const { data: hostProfile } = await supabase
        .from("profiles")
        .select("full_name, phone_number")
        .eq("id", car.owner_id)
        .single();

      // Import notification service


      // Prepare booking data for notifications
      const bookingNotificationData = {
        bookingId: booking.id,
        customerName: renterProfile?.full_name || "Customer",
        hostName: hostProfile?.full_name || "Host",
        carBrand: car.brand,
        carModel: car.model,
        pickupDate: format(startDate, "PPP"),
        pickupTime: startTime,
        pickupLocation: car.location || "Pickup location",
        dropoffLocation: car.location || "Return location",
        totalAmount: totalPrice,
        bookingReference: `MR-${booking.id.slice(-8).toUpperCase()}`
      };

      // Send notifications using new services (non-blocking)
      const { ResendEmailService, TwilioWhatsAppService } = await import("@/services/notificationService");
      const emailService = ResendEmailService.getInstance();
      const whatsappService = TwilioWhatsAppService.getInstance();

      if (renterProfile) {
        try {
          // Send email to renter
          await emailService.sendBookingConfirmation(
            {
              id: session.session.user.id,
              email: session.session.user.email,
              name: renterProfile.full_name || "Customer"
            },
            bookingNotificationData
          );

          // Send WhatsApp to renter
          await whatsappService.sendBookingConfirmation(
            {
              id: session.session.user.id,
              phone: renterProfile.phone_number,
              name: renterProfile.full_name || "Customer"
            },
            bookingNotificationData
          );

          console.log("✅ Renter notifications sent successfully");
        } catch (error) {
          console.error("❌ Failed to send renter notifications:", error);
        }
      }

      if (hostProfile) {
        try {
          // Get host email using Edge Function (safe server-side admin access)
          const { data: emailResponse, error: emailError } = await supabase.functions.invoke('get-user-email', {
            body: { userId: car.owner_id }
          });

          if (!emailError && emailResponse?.email) {
            // Send email to host
            await emailService.sendBookingConfirmation(
              {
                id: car.owner_id,
                email: emailResponse.email,
                name: hostProfile.full_name || "Host"
              },
              {
                ...bookingNotificationData,
                customerName: renterProfile?.full_name || "Customer"
              },
              true // isHost flag
            );
          }

          // Send WhatsApp to host
          await whatsappService.sendBookingConfirmation(
            {
              id: car.owner_id,
              phone: hostProfile.phone_number,
              name: hostProfile.full_name || "Host"
            },
            {
              ...bookingNotificationData,
              customerName: renterProfile?.full_name || "Customer"
            },
            true // isHost flag
          );

          console.log("✅ Host notifications sent successfully");
        } catch (error) {
          console.error("❌ Failed to send host notifications:", error);
        }
      }

      // Create legacy database notifications (non-blocking - don't let notification failures block the booking flow)
      try {
        // Create notification for renter
        await createNotification(
          session.session.user.id,
          "booking_request",
          `Your booking request for ${car.brand} ${car.model} from ${format(
            startDate,
            "PPP",
          )} to ${format(endDate, "PPP")} has been submitted.`,
          car.id,
          booking.id,
        );
      } catch (notificationError) {
        console.error(
          "Failed to create renter notification (non-blocking):",
          notificationError instanceof Error
            ? notificationError.message
            : JSON.stringify(notificationError, null, 2),
        );
      }

      try {
        // Create notification for host
        await createNotification(
          car.owner_id,
          "booking_request",
          `New booking request received for your ${car.brand} ${car.model
          } from ${format(startDate, "PPP")} to ${format(endDate, "PPP")}.`,
          car.id,
          booking.id,
        );
      } catch (notificationError) {
        console.error(
          "Failed to create host notification (non-blocking):",
          notificationError instanceof Error
            ? notificationError.message
            : JSON.stringify(notificationError, null, 2),
        );
      }

      if (!mountedRef.current) return;

      console.log(
        "[BookingDialog] Booking flow completed successfully, showing success modal...",
      );

      // Set success modal data
      setSuccessBookingData({
        id: booking.id,
        carBrand: car.brand,
        carModel: car.model,
        startDate: format(startDate, "PPP"),
        endDate: format(endDate, "PPP"),
        totalPrice: totalPrice,
      });

      onClose();
      setIsSuccessModalOpen(true);
    } catch (error) {
      if (!mountedRef.current) return;

      console.error(
        "Booking error:",
        error instanceof Error ? error.message : JSON.stringify(error, null, 2),
      );
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearTimeout(timeoutId);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleLocationSelected = (lat: number, lng: number) => {
    console.log('BookingDialog: Location selected', { lat, lng });
    setPickupLocation({
      latitude: lat,
      longitude: lng,
    });
  };

  const formatLocationDescription = () => {
    console.log('BookingDialog: Current pickupLocation', pickupLocation);
    if (!pickupLocation) return "No location selected";

    if (
      pickupLocation.latitude === car.latitude &&
      pickupLocation.longitude === car.longitude
    ) {
      return `Default: ${car.location}`;
    }

    return `Custom location (${pickupLocation.latitude.toFixed(
      4,
    )}, ${pickupLocation.longitude.toFixed(4)})`;
  };

  // Determine if a date should be disabled in the calendar
  const isDateDisabled = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate());
    tomorrow.setHours(0, 0, 0, 0);

    // Date is in the past
    if (date < tomorrow) return true;

    // Date is already booked
    return isDateUnavailable(date, bookedDates);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] md:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <BookingBreadcrumbs currentStep="confirmation" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>
                Book {car.brand} {car.model}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Select your rental dates and pickup location
              </DialogDescription>
            </DialogHeader>

            {isOwner && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not allowed</AlertTitle>
                <AlertDescription>
                  You cannot book your own car. This is for other renters only.
                </AlertDescription>
              </Alert>
            )}

            {!isAvailable && startDate && endDate && (
              <Alert variant="destructive" className="mb-4">
                <CalendarX className="h-4 w-4" />
                <AlertTitle>Not available</AlertTitle>
                <AlertDescription>
                  This car is not available for the selected dates. Please choose
                  different dates.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Select dates</h4>
                <Calendar
                  mode="range"
                  selected={{
                    from: startDate,
                    to: endDate,
                  }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  numberOfMonths={1}
                  disabled={isDateDisabled}
                  modifiers={{
                    booked: bookedDates,
                  }}
                  modifiersStyles={{
                    booked: {
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "rgb(239, 68, 68)",
                      textDecoration: "line-through",
                    },
                  }}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Pickup Location</h4>
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p>{formatLocationDescription()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLocationPickerOpen(true)}
                  >
                    Change
                  </Button>
                </div>
              </div>
              {startDate && endDate && (
                <div className="space-y-2">
                  <h4 className="font-medium">Summary</h4>
                  <div className="text-sm space-y-1 p-4 bg-primary/5 rounded-md">
                    <p>Start date: {format(startDate, "PPP")}</p>
                    <p>End date: {format(endDate, "PPP")}</p>

                    {/* Promo Code Input */}
                    <div className="py-2 border-y border-border/50 my-2">
                      <PromoCodeInput
                        userId={userId}
                        bookingAmount={isFeatureEnabled("DYNAMIC_PRICING") && finalPrice ? finalPrice : basePrice || 0}
                        onApply={handlePromoApplied}
                        onRemove={handlePromoRemoved}
                        appliedPromo={appliedPromo}
                      />
                    </div>

                    <div className="border-t border-border pt-2 mt-2">
                      <p className="font-medium text-primary">
                        Total: BWP {totalDisplayPrice.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLocationPickerOpen(true)}
                    >
                      Change
                    </Button>
                  </div>
                  {isFeatureEnabled("DYNAMIC_PRICING") && basePrice !== undefined && (
                    <PriceBreakdown
                      calculation={calculation}
                      basePrice={basePrice}
                      discountAmount={discountAmount}
                      promoCode={appliedPromo?.code}
                    />
                  )}
                  {isFeatureEnabled("INSURANCE_V2") && basePrice !== undefined && (
                    <>
                      <InsurancePackageSelector
                        dailyRentalAmount={car.price_per_day}
                        startDate={startDate}
                        endDate={endDate}
                        selectedPackageId={selectedInsurancePackageId || undefined}
                        onPackageSelect={(pkgId, premium) => {
                          setSelectedInsurancePackageId(pkgId);
                          setInsurancePremium(premium);
                        }}
                      />
                      {insurancePremium !== null && insurancePremium > 0 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-100">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-blue-900">Insurance Premium:</span>
                            <span className="font-bold text-blue-700">BWP {insurancePremium.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1 pt-1 border-t border-blue-200">
                            <span className="font-medium text-blue-900">Total with Insurance:</span>
                            <span className="font-bold text-blue-700">BWP {(totalDisplayPrice + insurancePremium).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={
                  !isVerified && !isVerificationLoading
                    ? () => setIsVerificationDialogOpen(true)
                    : handleBooking
                }
                disabled={
                  !startDate ||
                  !endDate ||
                  isLoading ||
                  isOwner ||
                  isCheckingAvailability ||
                  !isAvailable ||
                  !pickupLocation ||
                  isVerificationLoading
                }
                className="w-full sm:w-auto"
                variant={
                  !isVerified && !isVerificationLoading ? "outline" : "default"
                }
              >
                {isLoading || dpLoading
                  ? "Booking..."
                  : isCheckingAvailability
                    ? "Checking..."
                    : isVerificationLoading
                      ? "Checking verification..."
                      : !isVerified
                        ? "Start Verification"
                        : "Confirm"}
              </Button>
              {(!startDate || !endDate || !pickupLocation || !isAvailable) && (
                <div className="text-xs text-destructive mt-1 text-center">
                  {(!startDate || !endDate) && 'Please select dates'}
                  {!pickupLocation && 'Please select pickup location'}
                  {!isAvailable && 'Car not available for selected dates'}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VerificationRequiredDialog
        isOpen={isVerificationDialogOpen}
        onClose={() => setIsVerificationDialogOpen(false)}
        action="booking"
        carData={car}
      />

      <BookingLocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onLocationSelected={handleLocationSelected}
      />

      <BookingSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        bookingData={successBookingData}
      />
    </>
  );
};
