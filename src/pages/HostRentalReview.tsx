import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { CategoryRatingInput } from "@/components/reviews/CategoryRatingInput";
import { Loader2 } from "lucide-react";

const HOST_CATEGORIES = [
  { key: "punctuality", label: "Punctuality" },
  { key: "car_care", label: "Car Care" },
  { key: "communication", label: "Communication" },
];

export const HostRentalReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingReview, isLoading: isCheckingExisting } = useQuery({
    queryKey: ["existing-host-review", bookingId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", user.id)
        .eq("review_type", "host_to_renter")
        .maybeSingle();
      return data;
    },
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ["host-booking-review", bookingId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          cars (id, brand, model, image_url, owner_id),
          renter:profiles!renter_id (id, full_name, avatar_url)
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      // Verify user is the host
      if (data.cars.owner_id !== user.id) {
        throw new Error("Only the host can review the renter");
      }

      return data;
    },
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: booking!.renter_id,
        car_id: booking!.car_id,
        rating,
        comment,
        category_ratings: categoryRatings,
        review_type: "host_to_renter",
        status: "published",
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Review submitted successfully");
      navigate("/host-bookings");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isCheckingExisting) {
    return <div className="container max-w-2xl py-8 flex flex-col items-center justify-center min-h-[50vh]">
      <Loader2 className="animate-spin mb-2 h-6 w-6 text-muted-foreground" />
      <span className="text-muted-foreground">Loading review details...</span>
    </div>;
  }

  if (!booking) {
    return (
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" onClick={() => navigate("/host-bookings")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Booking not found or you don't have permission to review.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (existingReview) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center mb-6 relative">
          <div className="absolute left-0">
            <Button variant="ghost" onClick={() => navigate("/host-bookings")} className="p-0">
              <div className="flex items-center bg-gray-200 rounded-full p-1">
                <ArrowLeft className="h-10 w-10" />
              </div>
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h2 className="text-base md:text-lg font-semibold">Your Review</h2>
          </div>
        </div>
        <Card className="border-none">
          <CardContent className="space-y-4 pt-6">
            <p className="text-center text-green-600 font-medium">Review already submitted</p>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((v) => (
                <Star key={v} className={`h-8 w-8 ${v <= existingReview.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
              ))}
            </div>
            {existingReview.comment && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">{existingReview.comment}</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => navigate("/host-bookings")}>
              Back to Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center mb-6 relative">
        <div className="absolute left-0">
          <Button variant="ghost" onClick={() => navigate("/host-bookings")} className="p-0">
            <div className="flex items-center bg-gray-200 rounded-full p-1">
              <ArrowLeft className="h-10 w-10" />
            </div>
          </Button>
        </div>
        <div className="flex-1 text-center">
          <h2 className="text-base md:text-lg font-semibold">Review Renter</h2>
        </div>
      </div>

      <Card className="border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            How was your experience with {booking.renter?.full_name || "the renter"}?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {booking.cars.brand} {booking.cars.model}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <h6 className="font-normal text-gray-400 text-sm text-center">Rate Each Category</h6>
            <CategoryRatingInput
              categories={HOST_CATEGORIES}
              ratings={categoryRatings}
              onChange={(newRatings) => {
                setCategoryRatings(newRatings);
                const values = Object.values(newRatings);
                if (values.length > 0) {
                  const avg = values.reduce((a, b) => a + b, 0) / values.length;
                  setRating(Math.round(avg * 2) / 2);
                }
              }}
            />
            <Separator />
          </div>

          <div className="space-y-2 text-center">
            <h6 className="font-normal text-gray-400 text-sm">Overall Rating</h6>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={value <= rating ? "text-yellow-500" : ""}
                  onClick={() => setRating(value)}
                >
                  <Star className="h-8 w-8" fill={value <= rating ? "currentColor" : "none"} />
                </Button>
              ))}
            </div>
            <Separator />
          </div>

          <div className="space-y-2 text-left">
            <h6 className="font-medium text-xs">Detailed Review</h6>
            <Textarea
              placeholder="Share your experience with this renter..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] bg-gray-200 rounded-2xl p-4 placeholder:text-xs"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || Object.keys(categoryRatings).length < HOST_CATEGORIES.length || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HostRentalReview;
