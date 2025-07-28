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
import { FaStar } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export const RentalReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [isRenter, setIsRenter] = useState(false);
  
  // Category ratings state
  const [categoryRatings, setCategoryRatings] = useState({
    cleanliness: 0,
    punctuality: 0,
    responsiveness: 0,
    car_condition: 0,
    rental_experience: 0
  });

  // UI state for enhanced UX
  const [currentStep, setCurrentStep] = useState(1);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Role-aware content
  const getRoleSpecificContent = () => {
    if (isRenter) {
      return {
        title: "Rate Your Host & Car Experience",
        subtitle: "Help future renters by sharing your experience",
        categories: {
          cleanliness: "How clean was the car when you picked it up?",
          punctuality: "Was the host on time for pickup and return?", 
          responsiveness: "How quickly did the host respond to messages?",
          car_condition: "How was the overall condition of the car?",
          rental_experience: "How was your overall rental experience?"
        },
        placeholder: "Share details about your rental experience, the car condition, and interaction with the host..."
      };
    } else {
      return {
        title: "Rate Your Renter Experience", 
        subtitle: "Help future hosts by sharing your experience",
        categories: {
          cleanliness: "How did the renter return the car?",
          punctuality: "Was the renter on time for pickup and return?",
          responsiveness: "How well did the renter communicate?", 
          car_condition: "Did the renter take good care of your car?",
          rental_experience: "How was your overall hosting experience?"
        },
        placeholder: "Share details about the renter's behavior, communication, and how they treated your car..."
      };
    }
  };

  const roleContent = getRoleSpecificContent();

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

      console.log("Booking data:", bookingData);
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
      
      // Create preview URLs
      const previewUrls = fileList.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(previewUrls);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);
    
    setImages(newImages);
    setImagePreviewUrls(newPreviews);
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    let completed = 0;
    if (rating > 0) completed += 20;
    if (comment.trim().length > 0) completed += 20;
    
    const categoryCount = Object.values(categoryRatings).filter(r => r > 0).length;
    completed += (categoryCount / 5) * 40;
    
    if (images.length > 0) completed += 20;
    
    return Math.min(completed, 100);
  };

  // Validation
  const isFormValid = () => {
    return rating > 0 && comment.trim().length >= 10;
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
          .from("handover-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        return filePath;
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Determine review type based on user role
      const reviewType = isRenter ? "renter_to_host" : "host_to_renter";
      
      // Create the review with image URLs and category ratings
      const { error: reviewError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
        review_images: imageUrls, // Use new column name
        category_ratings: categoryRatings, // Add category ratings
        review_type: reviewType, // Use role-specific review type
        status: "published",
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!booking || !booking.cars) {
    return (
      <div className="container max-w-2xl py-8">
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
              onClick={() => navigate(-1)}
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

          <CardTitle>
            <h3 className="font-medium mb-4 text-left text-lg md:text-xl text-gray-800">
              {booking.cars.brand} {booking.cars.model}
            </h3>
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-xl text-gray-800">
                {roleContent.title}
              </h3>
              <div className="text-sm text-muted-foreground">
                {Math.round(getCompletionPercentage())}% complete
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{roleContent.subtitle}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            <Separator className="mt-4" />
          </div>

          <div className="space-y-3">
            <div className="text-center">
              <h6 className="font-medium text-lg mb-2">Overall Rating</h6>
              <p className="text-sm text-muted-foreground mb-4">
                Rate your overall {isRenter ? 'rental' : 'hosting'} experience
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="lg"
                  className={`p-2 transition-all duration-200 ${
                    value <= rating 
                      ? "text-yellow-500 scale-110" 
                      : "text-gray-300 hover:text-yellow-400 hover:scale-105"
                  }`}
                  onClick={() => setRating(value)}
                >
                  <Star
                    className="h-10 w-10"
                    fill={value <= rating ? "currentColor" : "none"}
                    stroke="currentColor"
                  />
                </Button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm font-medium text-primary">
                {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
              </p>
            )}
            <Separator />
          </div>

          {/* Enhanced Category Ratings */}
          <div className="space-y-6">
            <div className="text-center">
              <h6 className="font-medium text-lg mb-2">Detailed Ratings</h6>
              <p className="text-sm text-muted-foreground">
                Help others by rating specific aspects (optional)
              </p>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(roleContent.categories).map(([key, description]) => (
                <div key={key} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Label className="font-medium capitalize">
                        {key.replace('_', ' ')}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {description}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-primary">
                      {categoryRatings[key as keyof typeof categoryRatings] > 0 
                        ? `${categoryRatings[key as keyof typeof categoryRatings]}/5` 
                        : 'Not rated'}
                    </div>
                  </div>
                  <div className="flex gap-1 justify-center mt-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button
                        key={value}
                        variant="ghost"
                        size="sm"
                        className={`p-1 transition-all duration-200 ${
                          value <= categoryRatings[key as keyof typeof categoryRatings]
                            ? "text-yellow-500 scale-110" 
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                        onClick={() => setCategoryRatings(prev => ({...prev, [key]: value}))}
                      >
                        <Star
                          className="h-6 w-6"
                          fill={value <= categoryRatings[key as keyof typeof categoryRatings] ? "currentColor" : "none"}
                          stroke="currentColor"
                        />
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Separator />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="font-medium text-lg">Share Your Experience</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Tell others about your experience (minimum 10 characters)
              </p>
            </div>
            <div className="relative">
              <Textarea
                placeholder={roleContent.placeholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`min-h-[120px] bg-background rounded-lg p-4 resize-none transition-colors ${
                  comment.trim().length < 10 && comment.length > 0
                    ? "border-orange-300 focus:border-orange-500"
                    : comment.trim().length >= 10
                    ? "border-green-300 focus:border-green-500" 
                    : ""
                }`}
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {comment.length}/500
              </div>
            </div>
            {comment.length > 0 && comment.trim().length < 10 && (
              <p className="text-sm text-orange-600">
                Please write at least 10 characters for a meaningful review
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label className="font-medium text-lg">Add Photos (Optional)</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Share photos to help other users
              </p>
            </div>
            
            <ImageUpload onImageChange={handleImageChange} />
            
            {imagePreviewUrls.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  {imagePreviewUrls.length} photo(s) selected
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imagePreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSubmitReview}
              disabled={!isFormValid() || isSubmitting}
              className="w-full h-12 text-lg font-medium"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publishing Review...
                </div>
              ) : (
                `Publish ${isRenter ? 'Host' : 'Renter'} Review`
              )}
            </Button>
            
            {!isFormValid() && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-medium">Required to publish:</span>
                  <br />
                  {rating === 0 && "• Overall rating"}
                  {rating > 0 && comment.trim().length < 10 && "• At least 10 characters in review"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RentalReview;
