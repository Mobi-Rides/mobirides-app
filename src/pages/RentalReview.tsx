
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/add-car/ImageUpload";
import { toast } from "sonner";

export const RentalReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isRenter, setIsRenter] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: async () => {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (
            brand,
            model,
            owner_id
          ),
          renter:profiles!renter_id(
            full_name
          ),
          owner:profiles(
            full_name
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      const { data: { user } } = await supabase.auth.getUser();
      const userIsRenter = user?.id === bookingData.renter_id;

      // Make sure we have the reviewer's name
      if (userIsRenter && (!bookingData.owner || !bookingData.owner.full_name)) {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', bookingData.cars.owner_id)
          .single();

        if (!ownerError && ownerData) {
          bookingData.owner = ownerData;
        }
      } else if (!userIsRenter && (!bookingData.renter || !bookingData.renter.full_name)) {
        const { data: renterData, error: renterError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', bookingData.renter_id)
          .single();

        if (!renterError && renterData) {
          bookingData.renter = renterData;
        }
      }

      console.log("Booking data:", bookingData);
      return bookingData;
    }
  });

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (booking && user) {
        setIsRenter(user.id === booking.renter_id);
      }
    };
    
    checkUserRole();
  }, [booking]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setImages(fileList);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const revieweeId = isRenter ? booking?.cars?.owner_id : booking?.renter_id;
      if (!revieweeId) throw new Error("No reviewee found");

      // Upload all images and collect their URLs
      const uploadPromises = images.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${booking?.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('return-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        return filePath;
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Create the review with image URLs
      const { error: reviewError } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
        images: imageUrls,
        review_type: 'renter', // Always use 'renter' as per the database enum
        updated_at: new Date().toISOString()
      });

      if (reviewError) throw reviewError;
      
      // Update booking status to completed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;
      
      toast.success("Review submitted successfully");
      navigate('/dashboard');
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!booking || !booking.cars) {
    return <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader className="text-left">
          <CardTitle>Booking Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This booking doesn't exist or has been removed.</p>
        </CardContent>
      </Card>
    </div>;
  }

  return (
    <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="text-left">
          <CardTitle>{isRenter ? "Review Host" : "Review Renter"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4 text-left">
              {booking.cars.brand} {booking.cars.model}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="text-left">
                <span className="font-medium text-foreground">
                  {isRenter ? "Host" : "Renter"}: 
                </span>
                {" "}
                {isRenter ? booking.owner?.full_name : booking.renter?.full_name || "Not specified"}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Rate the {isRenter ? "Host" : "Renter"}</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={value <= rating ? "text-yellow-500" : ""}
                  onClick={() => setRating(value)}
                >
                  <Star className="h-5 w-5" fill={value <= rating ? "currentColor" : "none"} />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Upload Return Photos</h4>
            <ImageUpload onImageChange={handleImageChange} />
            {images.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {images.length} photo(s) selected
              </p>
            )}
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Comments</h4>
            <Textarea
              placeholder={`Share your experience with this ${isRenter ? "host" : "renter"}...`}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={rating === 0 || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
