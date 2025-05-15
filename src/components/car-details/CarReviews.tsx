
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, StarHalf, MessageSquare } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

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

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between dark:text-white">
          <div className="flex items-center gap-2">
            <span className="text-base text-left text-muted-foreground dark:text-white font-medium">Reviews</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {reviews?.length || 0} {reviews?.length === 1 ? 'review' : 'reviews'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews?.length === 0 && (
            <div className="text-center py-6">
              <span className="text-xs md:text-sm text-muted-foreground">
                No reviews yet
              </span>
            </div>
          )}
          
          {reviews?.map((review) => (
            <div key={review.id} className="border rounded-lg p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={review.reviewer.avatar_url 
                      ? supabase.storage.from('avatars').getPublicUrl(review.reviewer.avatar_url).data.publicUrl
                      : "/placeholder.svg"} 
                    alt={review.reviewer.full_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium">{review.reviewer.full_name}</span>
                </div>
                <div className="flex items-center">
                  <div className="flex gap-0.5 mr-2">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500" fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.created_at ? format(new Date(review.created_at), 'MMM d, yyyy') : ''}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
