import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, User, Car, Calendar, Check, Flag, EyeOff } from "lucide-react";
import type { ReviewWithDetails } from "@/pages/admin/AdminReviews";

interface ReviewDetailsDialogProps {
  review: ReviewWithDetails | null;
  onClose: () => void;
  onRefetch: () => void;
}

export const ReviewDetailsDialog = ({
  review,
  onClose,
  onRefetch,
}: ReviewDetailsDialogProps) => {
  if (!review) return null;

  const updateStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", review.id);

      if (error) throw error;
      toast.success(`Review ${status === "published" ? "approved" : status}`);
      onRefetch();
      onClose();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      published: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      flagged: "bg-red-100 text-red-800",
      hidden: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.pending;
  };

  return (
    <Dialog open={!!review} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reviewer Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getAvatarUrl(review.reviewer?.avatar_url)} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{review.reviewer?.full_name || "Unknown Reviewer"}</p>
              <p className="text-sm text-muted-foreground">Reviewer</p>
            </div>
            <Badge className={`ml-auto ${getStatusColor(review.status)}`}>
              {review.status}
            </Badge>
          </div>

          <Separator />

          {/* Rating */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">({review.rating}/5)</span>
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium mb-1">Comment:</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {review.comment || "No comment provided"}
            </p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Reviewee</p>
                <p className="font-medium">{review.reviewee?.full_name || "N/A"}</p>
              </div>
            </div>
            {review.car && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Car</p>
                  <p className="font-medium">{review.car.brand} {review.car.model}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(review.created_at), "MMM d, yyyy")}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <Badge variant="outline" className="mt-1">
                {review.review_type === "car" ? "Car Review" : 
                 review.review_type === "host_to_renter" ? "Host → Renter" : 
                 "Renter → Host"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {review.status !== "published" && (
              <Button onClick={() => updateStatus("published")} size="sm">
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            {review.status !== "flagged" && (
              <Button onClick={() => updateStatus("flagged")} variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-1" />
                Flag
              </Button>
            )}
            {review.status !== "hidden" && (
              <Button onClick={() => updateStatus("hidden")} variant="outline" size="sm">
                <EyeOff className="h-4 w-4 mr-1" />
                Hide
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
