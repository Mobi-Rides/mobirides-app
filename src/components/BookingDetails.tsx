import React from 'react';
import { useParams, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAvatarPublicUrl } from '@/utils/avatarUtils';
import { LoadingView } from '@/components/home/LoadingView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Car, MapPin, User, Clock, DollarSign, Shield, AlertTriangle, CreditCard, Wallet, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingPayment } from '@/hooks/useBookingPayment';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  cars: (Database['public']['Tables']['cars']['Row'] & {
    owner: Database['public']['Tables']['profiles']['Row'] | null;
  }) | null;
  renter: Database['public']['Tables']['profiles']['Row'] | null;
  insurance_policies?: Database['public']['Tables']['insurance_policies']['Row'][];
};

export const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const autoPay = searchParams.get('pay') === 'true';

  const [paymentMethod, setPaymentMethod] = React.useState<'card' | 'orange_money' | 'myzaka' | 'smega'>('card');
  const [mobileNumber, setMobileNumber] = React.useState('');

  const { isProcessing, initiatePayment } = useBookingPayment({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    }
  });

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      if (!id) throw new Error('Booking ID is required');

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          cars (*, owner:profiles!owner_id (*)),
          renter:profiles!renter_id (*),
          insurance_policies (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Booking;
    },
    enabled: !!id,
  });

  if (!id) {
    return <Navigate to="/bookings" replace />;
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
          <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/bookings')}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Check if user has permission to view this booking
  const isRenter = user?.id === booking.renter_id;
  const isHost = user?.id === booking.cars?.owner_id;

  if (!isRenter && !isHost) {
    return <Navigate to="/bookings" replace />;
  }

  const handlePayNow = () => {
    if (!id || !booking) return;
    
    // Provide full price breakdown for the payment service
    const insurancePremium = booking.insurance_premium || 0;
    const discountAmount = booking.discount_amount || 0;
    const grandTotal = booking.total_price || 0;
    
    // Calculate base rental price (total - insurance + discounts)
    // This handles the mock service expectations
    const baseRentalPrice = grandTotal - insurancePremium + discountAmount;

    initiatePayment({
      booking_id: id,
      payment_method: paymentMethod,
      mobile_number: mobileNumber,
      base_rental_price: baseRentalPrice,
      dynamic_pricing_adjustment: 0,
      insurance_premium: insurancePremium,
      discount_amount: discountAmount,
      grand_total: grandTotal
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_payment':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/bookings')}
          className="mb-4"
        >
          ← Back
        </Button>
        <h1 className="text-3xl font-bold">Booking Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Booking ID:</span>
              <span className="text-sm text-muted-foreground">#{booking.id}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Start:</span>
                <span>{formatDate(booking.start_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">End:</span>
                <span>{formatDate(booking.end_date)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Amount:
              </span>
              <span className="font-bold text-lg">P{booking.total_price}</span>
            </div>

            {/* Payment Status */}
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="font-medium">Payment Status:</span>
              <Badge className={getPaymentStatusColor(booking.payment_status || 'unpaid')}>
                {(booking.payment_status || 'unpaid').toUpperCase()}
              </Badge>
            </div>

            {booking.status === 'awaiting_payment' && booking.payment_deadline && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Deadline: {formatDate(booking.payment_deadline)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Car Information */}
        {booking.cars && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.cars.year} {booking.cars.brand} {booking.cars.model}
                </h3>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Daily Rate:</span>
                <span>P{booking.cars.price_per_day}/day</span>
              </div>
              {booking.cars?.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <div>
                    <span className="font-medium">Pickup Location:</span>
                    <p className="text-sm text-muted-foreground">{booking.cars.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isRenter ? 'Host Information' : 'Renter Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.status === 'pending' ? (
              <div className="text-center text-muted-foreground">
                <p>Contact information will be available once the booking is confirmed.</p>
              </div>
            ) : isHost && booking.renter ? (
              <div className="flex items-center gap-4">
                {booking.renter.avatar_url ? (
                  <img
                    src={getAvatarPublicUrl(booking.renter.avatar_url)}
                    alt={booking.renter.full_name || 'Renter'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted border-2 border-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{booking.renter.full_name}</p>
                  {booking.renter.phone_number && (
                    <a
                      href={`tel:${booking.renter.phone_number}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {booking.renter.phone_number}
                    </a>
                  )}
                </div>
              </div>
            ) : isRenter && booking.cars?.owner ? (
              <div className="flex items-center gap-4">
                {booking.cars.owner.avatar_url ? (
                  <img
                    src={getAvatarPublicUrl(booking.cars.owner.avatar_url)}
                    alt={booking.cars.owner.full_name || 'Host'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted border-2 border-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{booking.cars.owner.full_name}</p>
                  {booking.cars.owner.phone_number && (
                    <a
                      href={`tel:${booking.cars.owner.phone_number}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {booking.cars.owner.phone_number}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Contact information not available.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Created:</span>
              <span className="text-sm">{formatDate(booking.created_at)}</span>
            </div>
            {booking.updated_at && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Last Updated:</span>
                <span className="text-sm">{formatDate(booking.updated_at)}</span>
              </div>
            )}

            {/* Insurance Policy Section */}
            {booking.insurance_policies?.[0] && (
              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Insurance Policy:
                  </span>
                  <Badge variant="outline">Included</Badge>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                  <span>Policy Number:</span>
                  <span className="font-mono">{booking.insurance_policies[0].policy_number}</span>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate('/insurance/policies')}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  View Policy Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pay Now Section for Renters */}
      {isRenter && booking.status === 'awaiting_payment' && booking.payment_status === 'unpaid' && (
        <Card className="mt-6 border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
              <CreditCard className="h-5 w-5" />
              Complete Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-amber-100/50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              <AlertTitle className="text-amber-800 font-semibold">Action Required</AlertTitle>
              <AlertDescription className="text-amber-700">
                Your booking is approved but not yet confirmed. You must complete payment before the pickup date to secure your rental.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Payment Method</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(val: 'card' | 'orange_money' | 'myzaka' | 'smega') => setPaymentMethod(val)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className={`flex items-center space-x-2 border p-4 rounded-md cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'bg-background'}`} onClick={() => setPaymentMethod('card')}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex flex-1 items-center gap-2 cursor-pointer font-medium">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-md cursor-pointer transition-colors ${paymentMethod === 'orange_money' ? 'border-primary bg-primary/5' : 'bg-background'}`} onClick={() => setPaymentMethod('orange_money')}>
                  <RadioGroupItem value="orange_money" id="orange_money" />
                  <Label htmlFor="orange_money" className="flex flex-1 items-center gap-2 cursor-pointer font-medium">
                    <Smartphone className="h-4 w-4" />
                    Orange Money
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-md cursor-pointer transition-colors ${paymentMethod === 'myzaka' ? 'border-primary bg-primary/5' : 'bg-background'}`} onClick={() => setPaymentMethod('myzaka')}>
                  <RadioGroupItem value="myzaka" id="myzaka" />
                  <Label htmlFor="myzaka" className="flex flex-1 items-center gap-2 cursor-pointer font-medium">
                    <Wallet className="h-4 w-4" />
                    MyZaka (Mascom)
                  </Label>
                </div>
                <div className={`flex items-center space-x-2 border p-4 rounded-md cursor-pointer transition-colors ${paymentMethod === 'smega' ? 'border-primary bg-primary/5' : 'bg-background'}`} onClick={() => setPaymentMethod('smega')}>
                  <RadioGroupItem value="smega" id="smega" />
                  <Label htmlFor="smega" className="flex flex-1 items-center gap-2 cursor-pointer font-medium">
                    <Smartphone className="h-4 w-4" />
                    Smega (BTC)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod !== 'card' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label htmlFor="phone">Enter Mobile Number</Label>
                <Input 
                  id="phone" 
                  placeholder="e.g. 71234567" 
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">We'll send a USSD prompt or SMS to this number.</p>
              </div>
            )}

            <Button 
              className="w-full text-lg h-12" 
              size="lg"
              disabled={isProcessing || (paymentMethod !== 'card' && !mobileNumber)}
              onClick={handlePayNow}
            >
              {isProcessing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay P${booking.total_price} Now`
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingDetails;