import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Car } from "@/types/car";

interface CarReviewsProps {
  car: Car;
}

export const CarReviews = ({ car }: CarReviewsProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { toast } = useToast();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["car-reviews", car.id],
    queryFn: async () => {
      console.log("Fetching reviews for car:", car.id);
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviewer_id (
            full_name,
            avatar_url
          )
        `)
        .eq("car_id", car.id)
        .eq("review_type", "car")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
        throw error;
      }

      console.log("Retrieved reviews:", data);
      return data;
    },
  });

  const handleSubmitReview = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a review.",
          variant: "destructive",
        });
        return;
      }

      // Get the latest completed booking for this car by the current user
      const { data: booking } = await supabase
        .from("bookings")
        .select("id")
        .eq("car_id", car.id)
        .eq("renter_id", session.user.id)
        .eq("status", "completed")
        .order("end_date", { ascending: false })
        .limit(1)
        .single();

      if (!booking) {
        toast({
          title: "Error",
          description: "You can only review cars after completing a booking.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("reviews")
        .insert({
          car_id: car.id,
          reviewer_id: session.user.id,
          reviewee_id: car.owner_id,
          booking_id: booking.id,
          rating,
          comment,
          review_type: "car",
          created_at: now,
          updated_at: now,
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      setIsReviewDialogOpen(false);
      setRating(0);
      setComment("");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Could not submit the review. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Reviews</h2>
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Write a Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button
                    key={value}
                    variant="ghost"
                    size="sm"
                    className={value <= rating ? "text-yellow-500" : ""}
                    onClick={() => setRating(value)}
                  >
                    <Star className="h-5 w-5" />
                  </Button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button 
                onClick={handleSubmitReview}
                disabled={rating === 0}
              >
                Submit Review
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
        {reviews?.map((review) => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                by {review.reviewer.full_name}
              </span>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        ))}
        
        {reviews?.length === 0 && (
          <p className="text-center text-muted-foreground">
            No reviews yet
          </p>
        )}
      </div>
    </div>
  );
};