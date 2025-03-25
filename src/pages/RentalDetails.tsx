
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  FileText,
  Calendar,
  MapPin,
  Car,
  CreditCard,
  KeyRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  HelpCircle,
  User,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { format, differenceInDays, isWithinInterval, addDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { createHandoverSession } from "@/services/handoverService";
import { toast } from "sonner";
import { CarDescription } from "@/components/car-details/CarDescription";
import { CarOwner } from "@/components/car-details/CarOwner";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RentalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldPrint = location.search.includes("print=true");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["rental-details", id],
    queryFn: async () => {
      console.log("Fetching rental details for ID:", id);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          renter:profiles!renter_id (
            id,
            full_name,
            avatar_url
          ),
          car:cars (
            *,
            owner:profiles!owner_id (
              id,
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Auto-print when print parameter is present
  useEffect(() => {
    if (shouldPrint && booking && !isLoading) {
      const timer = setTimeout(() => {
        window.print();
        // Remove the print parameter after printing
        navigate(`/rental-details/${id}`, { replace: true });
      }, 500); // Short delay to ensure content is rendered

      return () => clearTimeout(timer);
    }
  }, [shouldPrint, booking, isLoading, id, navigate]);

  // Checking if the current user is the renter
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  const isRenter =
    booking && currentUser && booking.renter_id === currentUser.id;
  const isOwner =
    booking && currentUser && booking.car.owner_id === currentUser.id;

  // Check if the rental is active (within the rental period)
  const isActiveRental =
    booking &&
    booking.status === "confirmed" &&
    isWithinInterval(new Date(), {
      start: new Date(booking.start_date),
      end: addDays(new Date(booking.end_date), 1), // Include the end date
    });

  const isCompletedRental = booking && booking.status === "completed";

  // Check if handover is possible (on start or end date)
  const today = new Date();
  const startDate = booking ? new Date(booking.start_date) : null;
  const endDate = booking ? new Date(booking.end_date) : null;

  const isStartHandoverDay =
    startDate &&
    today.getDate() === startDate.getDate() &&
    today.getMonth() === startDate.getMonth() &&
    today.getFullYear() === startDate.getFullYear();

  const isEndHandoverDay =
    endDate &&
    today.getDate() === endDate.getDate() &&
    today.getMonth() === endDate.getMonth() &&
    today.getFullYear() === endDate.getFullYear();

  const canHandover =
    booking &&
    booking.status === "confirmed" &&
    (isStartHandoverDay || isEndHandoverDay);
  const handoverType = isStartHandoverDay ? "pickup" : "return";

  const [isInitiatingHandover, setIsInitiatingHandover] = useState(false);

  const handleInitiateHandover = async () => {
    if (!booking || !currentUser) return;

    setIsInitiatingHandover(true);
    try {
      // Create or get existing handover session
      const session = await createHandoverSession(
        booking.id,
        booking.car.owner_id,
        booking.renter_id
      );

      if (session) {
        // Navigate to map with handover mode
        const role = isRenter ? "renter" : "host";
        navigate(`/map?bookingId=${booking.id}&mode=handover&role=${role}`);
      }
    } catch (error) {
      console.error("Error initiating handover:", error);
      toast.error("Failed to initiate handover process");
    } finally {
      setIsInitiatingHandover(false);
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-48 ml-4" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <Navigation />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Rental details not found</h2>
              <p className="text-muted-foreground">The rental information you're looking for could not be found.</p>
              <Button onClick={() => navigate('/bookings')}>View All Bookings</Button>
            </div>
          </CardContent>
        </Card>
        <Navigation />
      </div>
    );
  }

  const rentalDurationDays =
    differenceInDays(new Date(booking.end_date), new Date(booking.start_date)) +
    1; // Include the first day

  // Generate status badge
  const getStatusBadge = () => {
    let variant = "outline";
    let icon = <HelpCircle className="h-3 w-3 mr-1" />;
    
    switch(booking.status) {
      case "confirmed":
        variant = "success";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "pending":
        variant = "warning";
        icon = <Clock className="h-3 w-3 mr-1" />;
        break;
      case "completed":
        variant = "default";
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
        break;
      case "cancelled":
        variant = "destructive";
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
        break;
    }
    
    return (
      <Badge variant={variant as any} className="flex items-center">
        {icon}
        <span className="capitalize">{booking.status}</span>
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {getStatusBadge()}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl font-bold">Rental Details</h1>
          {isCompletedRental && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 sm:mt-0 flex items-center gap-2"
              onClick={() => window.print()}
            >
              <Receipt className="h-4 w-4" />
              Download Receipt
            </Button>
          )}
        </div>

        {/* Car Card */}
        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="p-4 bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <img
                src={booking.car.image_url || "/placeholder.svg"}
                alt={`${booking.car.brand} ${booking.car.model}`}
                className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-lg"
              />
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {booking.car.brand} {booking.car.model} ({booking.car.year})
                  </h3>
                  <div className="flex items-center gap-1 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.car.location}</span>
                  </div>
                </div>
                <p className="text-lg font-medium mt-2">BWP {booking.car.price_per_day} per day</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 bg-muted/10 border-t">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/car/${booking.car.id}`)} 
              className="text-xs"
            >
              View Vehicle Details
            </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Person Card - Conditionally show host or renter */}
          {isRenter ? (
            <CarOwner
              ownerName={booking.car.owner.full_name}
              avatarUrl={booking.car.owner.avatar_url}
              ownerId={booking.car.owner.id}
              carId={booking.car.id}
            />
          ) : (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                  <User className="h-5 w-5 text-primary dark:text-primary-foreground" />
                  Renter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      booking.renter.avatar_url
                        ? supabase.storage
                            .from("avatars")
                            .getPublicUrl(booking.renter.avatar_url).data
                            .publicUrl
                        : "/placeholder.svg"
                    }
                    alt={booking.renter.full_name}
                    className="w-12 h-12 rounded-full object-cover bg-muted"
                  />
                  <div>
                    <p className="font-semibold">{booking.renter.full_name}</p>
                    <p className="text-sm text-muted-foreground">Vehicle Renter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rental Duration Card */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                <Calendar className="h-5 w-5 text-primary dark:text-primary-foreground" />
                Rental Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.start_date), "PPP")}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(new Date(booking.end_date), "PPP")}
                  </p>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                <span className="text-sm">
                  {rentalDurationDays} day{rentalDurationDays !== 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <CarDescription description={booking.car.description} />

        {/* Payment Details Card */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
              <CreditCard className="h-5 w-5 text-primary dark:text-primary-foreground" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <p>Daily Rate</p>
              <p>BWP {booking.car.price_per_day}</p>
            </div>
            <div className="flex justify-between">
              <p>Duration</p>
              <p>
                {rentalDurationDays} day{rentalDurationDays !== 1 ? "s" : ""}
              </p>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <p>Total</p>
              <p>BWP {booking.total_price}</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
          <TooltipProvider>
            {(isCompletedRental || isActiveRental) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="w-full sm:w-auto flex items-center gap-2"
                    onClick={() => navigate(`/rental-review/${booking.id}`)}
                  >
                    <Star className="h-4 w-4" />
                    Write Review
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share your experience with this vehicle</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canHandover && (
              <Button
                className="w-full sm:w-auto flex items-center gap-2"
                variant="default"
                onClick={handleInitiateHandover}
                disabled={isInitiatingHandover}
              >
                <KeyRound className="h-4 w-4" />
                {isInitiatingHandover
                  ? "Initiating..."
                  : `Initiate ${handoverType === "pickup" ? "Pickup" : "Return"}`}
              </Button>
            )}

            {isActiveRental && !canHandover && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="w-full sm:w-auto flex items-center gap-2"
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/map?handover=true&bookingId=${booking.id}&role=${
                          isRenter ? "renter" : "host"
                        }`
                      )
                    }
                  >
                    <MapPin className="h-4 w-4" />
                    View Handover Status
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See the real-time status of your car handover</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default RentalDetails;
