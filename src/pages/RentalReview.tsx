import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Slash, Star, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/add-car/ImageUpload";
import { toast } from "sonner";
import { FaStar } from "react-icons/fa";
import { RxDividerHorizontal } from "react-icons/rx";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export const RentalReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isRenter, setIsRenter] = useState(false);

  // Check for existing review first
  const { data: existingReview, isLoading: isCheckingExisting } = useQuery({
    queryKey: ["existing-review", bookingId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: async () => {
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          cars (
            brand,
            model,
            owner_id,
            vehicle_type,
            image_url,
            owner:profiles!owner_id(
              full_name
            )
          ),
          renter:profiles!renter_id(
            full_name
          )
        `
        )
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userIsRenter = user?.id === bookingData.renter_id;

      // Make sure we have the reviewer's name
      if (
        userIsRenter &&
        (!bookingData.cars.owner || !bookingData.cars.owner.full_name)
      ) {
        const { data: ownerData, error: ownerError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", bookingData.cars.owner_id)
          .single();

        if (!ownerError && ownerData) {
          bookingData.cars.owner = ownerData;
        }
      } else if (
        !userIsRenter &&
        (!bookingData.renter || !bookingData.renter.full_name)
      ) {
        const { data: renterData, error: renterError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", bookingData.renter_id)
          .single();

        if (!renterError && renterData) {
          bookingData.renter = renterData;
        }
      }

      return bookingData;
    },
  });

  useEffect(() => {
    const checkUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const revieweeId = isRenter
        ? booking?.cars?.owner_id
        : booking?.renter_id;
      if (!revieweeId) throw new Error("No reviewee found");

      // Upload all images and collect their URLs
      const uploadPromises = images.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.${fileExt}`;
        const filePath = `${booking?.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("return-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        return filePath;
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Create the review with image URLs
      // Car reviews are about the rental experience and should be displayed on car detail pages
      const reviewType = "car";
      const { error: reviewError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        car_id: booking.car_id,
        rating,
        comment,
        review_images: imageUrls,
        review_type: reviewType,
        updated_at: new Date().toISOString(),
      });

      if (reviewError) throw reviewError;

      // Update booking status to completed
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);

      if (bookingError) throw bookingError;

      toast.success("Review submitted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isCheckingExisting) {
    return <div className="container max-w-2xl py-8 flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (!booking || !booking.cars) {
    return (
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" onClick={() => navigate('/bookings')} className="">
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
      </div>
    );
  }

  // Show existing review if already submitted
  if (existingReview) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="rounded-lg overflow-hidden mb-6">
          <div className="flex items-center mb-4 relative">
            <div className="absolute left-0">
              <Button
                variant="ghost"
                onClick={() => navigate('/bookings')}
                className="p-0"
              >
                <div className="flex items-center bg-gray-200 rounded-full p-1">
                  <ArrowLeft className="h-10 w-10" />
                </div>
              </Button>
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-base md:text-lg text-slate-800 font-semibold">
                Your Review
              </h2>
            </div>
          </div>
        </div>

        <Card className="rounded-lg overflow-hidden border-none">
          <div className="flex justify-center mt-8">
            <img
              src={booking.cars.image_url}
              alt="Car Image"
              className="w-80 h-full rounded-2xl"
            />
          </div>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Check className="h-8 w-8 text-green-500" />
              <span className="text-lg font-medium text-green-600">Review Submitted</span>
            </div>
            <CardTitle className="font-medium text-lg md:text-xl text-gray-800">
              {booking.cars.brand} {booking.cars.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`h-8 w-8 ${value <= existingReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
            
            {existingReview.comment && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Comment:</p>
                <p className="text-muted-foreground">{existingReview.comment}</p>
              </div>
            )}

            <p className="text-sm text-center text-muted-foreground">
              Submitted on {format(new Date(existingReview.created_at), "MMMM d, yyyy")}
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/bookings')}
            >
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="  rounded-lg overflow-hidden mb-6">
        <div className="flex items-center mb-4 relative ">
          <div className="absolute left-0">
            <Button
              variant="ghost"
              onClick={() => navigate('/bookings')}
              className="p-0"
            >
              <div className="flex items-center bg-gray-200 rounded-full p-1">
                <ArrowLeft className="h-10 w-10" />
              </div>
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-base md:text-lg text-slate-800 font-semibold">
              Leave Review
            </h2>
          </div>
        </div>
      </div>

      <Card className="rounded-lg overflow-hidden border-none">
        <div className="flex justify-center mt-8">
          <img
            src={booking.cars.image_url}
            alt="Car Image"
            className="w-80 h-full rounded-2xl"
          />
        </div>
        <CardHeader className="text-left">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-2xl text-sm bg-[#F1F0FB] text-[#7C3AED] w-fit mb-2">
              {booking.cars.vehicle_type}
            </span>

            <div className="flex items-center gap-2">
              <FaStar className="h-4 w-4 text-yellow-400" />
              <p className="text-sm md:text-base font-medium text-gray-300">
                4.9
              </p>
            </div>
          </div>

          <CardTitle className="font-medium mb-4 text-left text-lg md:text-xl text-gray-800">
            {booking.cars.brand} {booking.cars.model}
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="font-medium mb-4 text-left text-2xl md:text-2xl text-gray-800 text-center">
              How is Your Rental Experience?
            </h2>
            <Separator />
          </div>

          <div className="space-y-2 text-left">
            <h6 className="font-normal text-gray-400 text-sm md:text-base text-center">
              Your Overall Rating
            </h6>
            <div className="flex gap-1 text-center justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={value <= rating ? "text-yellow-500" : ""}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className="h-8 w-8 "
                    fill={value <= rating ? "currentColor" : "none"}
                    stroke={value <= rating ? "currentColor" : "currentColor"}
                  />
                </Button>
              ))}
            </div>
            <Separator />
          </div>

          <div className="space-y-2 text-left">
            <h6 className="font-medium text-xs">Enter Detailed Review</h6>
            <Textarea
              placeholder={`Share your experience with this ${
                isRenter ? "host" : "renter"
              }...`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] bg-gray-200 rounded-2xl p-4 placeholder:text-xs"
            />
          </div>

          <div className="space-y-2 text-left">
            <ImageUpload onImageChange={handleImageChange} />
            {images.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {images.length} photo(s) selected
              </p>
            )}
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

export default RentalReview;
