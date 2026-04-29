import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  car_id: string;
  reviewer_id: string;
  reviewee_id: string;
  booking_id: string;
  rating: number;
  comment: string;
  response?: string;
  response_at?: string;
  review_type: "car" | "renter";
  status: "published" | "pending" | "flagged";
  category_ratings?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/**
 * Submit a review for a car booking
 */
export const submitReview = async ({
  carId,
  reviewerId,
  revieweeId,
  bookingId,
  rating,
  comment,
  categoryRatings = {},
}: {
  carId: string;
  reviewerId: string;
  revieweeId: string;
  bookingId: string;
  rating: number;
  comment: string;
  categoryRatings?: Record<string, number>;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Verify booking is completed and user is the renter
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("status, renter_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status !== "completed") {
      return { success: false, error: "You can only review completed bookings" };
    }

    if (booking.renter_id !== reviewerId) {
      return { success: false, error: "Only the renter can review this booking" };
    }

    // 2. Check if review already exists for this booking/car/reviewer
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("reviewer_id", reviewerId)
      .maybeSingle();

    if (existingReview) {
      return { success: false, error: "You have already reviewed this booking" };
    }

    // 3. Submit review
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("reviews")
      .insert({
        car_id: carId,
        reviewer_id: reviewerId,
        reviewee_id: revieweeId,
        booking_id: bookingId,
        rating,
        comment,
        category_ratings: categoryRatings,
        review_type: "car",
        status: "published",
        created_at: now,
        updated_at: now,
      });

    if (insertError) throw insertError;

    return { success: true };
  } catch (error) {
    console.error("Error submitting review:", error);
    return { success: false, error: "Failed to submit review" };
  }
};

/**
 * Submit a host response to a review
 */
export const submitHostResponse = async (
  reviewId: string,
  hostId: string,
  responseText: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Verify review exists and hostId matches revieweeId
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("reviewee_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return { success: false, error: "Review not found" };
    }

    if (review.reviewee_id !== hostId) {
      return { success: false, error: "Only the host can respond to this review" };
    }

    // 2. Update review with response
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        response: responseText.trim(),
        response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error("Error submitting host response:", error);
    return { success: false, error: "Failed to submit response" };
  }
};

/**
 * Calculate average rating from a list of reviews
 */
export const calculateAverageRating = (reviews: { rating: number }[]): number => {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Number((total / reviews.length).toFixed(1));
};

/**
 * Get reviews for a specific car
 */
export const getCarReviews = async (carId: string): Promise<Review[]> => {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("car_id", carId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching car reviews:", error);
    return [];
  }

  return data as Review[];
};
