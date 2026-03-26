
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, StarHalf, MessageSquare, User, ChevronDown, Reply } from "lucide-react";
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
import { getAvatarPublicUrl } from "@/utils/avatarUtils";
import { useToast } from "@/hooks/use-toast";
import type { Car } from "@/types/car";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CategoryRatingDisplay } from "@/components/reviews/CategoryRatingDisplay";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface CarReviewsProps {
  car: Car;
}

interface ReviewWithResponse {
  id: string;
  booking_id: string | null;
  car_id: string | null;
  category_ratings: Record<string, number> | null;
  comment: string | null;
  created_at: string;
  rating: number;
  response: string | null;
  response_at: string | null;
  review_images: string[] | null;
  review_type: string;
  reviewee_id: string;
  reviewer_id: string;
  status: string | null;
  updated_at: string;
  reviewer: {
    full_name: string;
    avatar_url: string | null;
  };
}

export const CarReviews = ({ car }: CarReviewsProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [respondingToReview, setRespondingToReview] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if current user is the host
  useEffect(() => {
    const checkHostStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setIsHost(user.id === car.owner_id);
      }
    };
    checkHostStatus();
  }, [car.owner_id]);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["car-reviews", car.id],
    queryFn: async () => {
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

      return data;
    },
  });

  const { data: categoryAverages } = useQuery({
    queryKey: ["car-category-ratings", car.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("calculate_category_ratings", {
        p_car_id: car.id,
      });
      if (error) {
        console.error("Error fetching category ratings:", error);
        return {};
      }
      return (data as Record<string, number>) || {};
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
          status: "published",
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

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          response: responseText.trim(),
          response_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) throw error;

      toast({
        title: "Response submitted",
        description: "Your response has been posted.",
      });

      setRespondingToReview(null);
      setResponseText("");
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Could not submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingResponse(false);
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
        {categoryAverages && Object.keys(categoryAverages).length > 0 && (
          <div className="mt-2">
            <CategoryRatingDisplay categoryAverages={categoryAverages} />
          </div>
        )}
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

          {reviews?.map((review: ReviewWithResponse) => (
            <div key={review.id} className="border rounded-lg p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {review.reviewer.avatar_url ? (
                    <img
                      src={getAvatarPublicUrl(review.reviewer.avatar_url)}
                      alt={review.reviewer.full_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
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
              {review.category_ratings && typeof review.category_ratings === 'object' && Object.keys(review.category_ratings as Record<string, number>).length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground transition-colors">
                    <ChevronDown className="h-3 w-3" />
                    Category breakdown
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <CategoryRatingDisplay categoryAverages={review.category_ratings as Record<string, number>} />
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Host Response Section */}
              {review.response && (
                <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Reply className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Host Response</span>
                    {review.response_at && (
                      <span className="text-xs text-muted-foreground">
                        • {format(new Date(review.response_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.response}</p>
                </div>
              )}

              {/* Host Response Form */}
              {isHost && !review.response && respondingToReview !== review.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-xs"
                  onClick={() => setRespondingToReview(review.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Respond to this review
                </Button>
              )}

              {isHost && respondingToReview === review.id && (
                <div className="mt-3 space-y-2">
                  <Separator />
                  <Textarea
                    placeholder="Write your response to this review..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitResponse(review.id)}
                      disabled={isSubmittingResponse || !responseText.trim()}
                    >
                      {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRespondingToReview(null);
                        setResponseText("");
                      }}
                      disabled={isSubmittingResponse}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
