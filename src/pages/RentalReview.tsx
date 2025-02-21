
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
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

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-review", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select(`
          *,
          cars (
            brand,
            model
          ),
          renter:profiles!renter_id (
            full_name
          )
        `).eq("id", bookingId).single();
      if (error) throw error;
      return data;
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setImages(prev => [...prev, ...fileList]);
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Upload images first
      const imageUrls = await Promise.all(images.map(async file => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('return-photos').upload(filePath, file);
        if (uploadError) throw uploadError;
        return filePath;
      }));

      // Create the review - only include properties defined in the schema
      const { error: reviewError } = await supabase.from('reviews').insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: booking?.renter_id,
        rating,
        comment,
        review_type: 'renter',
        updated_at: new Date().toISOString()
      });
      if (reviewError) throw reviewError;
      toast.success("Review submitted successfully");
      navigate(-1);
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

  return <div className="container max-w-2xl py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="text-left">
          <CardTitle>Review Renter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4 text-left">
              {booking?.cars.brand} {booking?.cars.model}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="text-left">
                <span className="font-medium text-foreground">Renter: </span>
                {booking?.renter.full_name}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Rate the Renter</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(value => <Button key={value} variant="ghost" size="sm" className={value <= rating ? "text-yellow-500" : ""} onClick={() => setRating(value)}>
                  <Star className="h-5 w-5" fill={value <= rating ? "currentColor" : "none"} />
                </Button>)}
            </div>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Upload Return Photos</h4>
            <ImageUpload onImageChange={handleImageChange} />
            {images.length > 0 && <p className="text-sm text-muted-foreground">
                {images.length} photo(s) selected
              </p>}
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-medium">Comments</h4>
            <Textarea placeholder="Share your experience with this renter..." value={comment} onChange={e => setComment(e.target.value)} className="min-h-[100px]" />
          </div>

          <Button onClick={handleSubmitReview} disabled={rating === 0 || isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </CardContent>
      </Card>
    </div>;
};
