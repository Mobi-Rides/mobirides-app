import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Star, MoreVertical, Eye, Check, Flag, EyeOff, Trash2, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReviewWithDetails } from "@/pages/admin/AdminReviews";

interface ReviewManagementTableProps {
  reviews: ReviewWithDetails[];
  isLoading: boolean;
  onViewDetails: (review: ReviewWithDetails) => void;
  onRefetch: () => void;
}

export const ReviewManagementTable = ({
  reviews,
  isLoading,
  onViewDetails,
  onRefetch,
}: ReviewManagementTableProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const updateReviewStatus = async (reviewId: string, status: string) => {
    try {
      setUpdatingId(reviewId);
      const { error } = await supabase
        .from("reviews")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", reviewId);

      if (error) throw error;
      toast.success(`Review ${status === "published" ? "approved" : status}`);
      onRefetch();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review status");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      setUpdatingId(reviewId);
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      toast.success("Review deleted");
      onRefetch();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      published: { variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" },
      pending: { variant: "secondary", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100" },
      flagged: { variant: "destructive", className: "bg-red-100 text-red-800" },
      hidden: { variant: "outline", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    };
    const config = variants[status] || variants.pending;
    return <Badge className={config.className}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      car: "Car",
      host_to_renter: "Host → Renter",
      renter_to_host: "Renter → Host",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getAvatarUrl = (avatarPath: string | null | undefined) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews found matching your filters</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reviewer</TableHead>
          <TableHead>Reviewee / Car</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Comment</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reviews.map((review) => (
          <TableRow key={review.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(review.reviewer?.avatar_url)} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {review.reviewer?.full_name || "Unknown"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {review.review_type === "car" && review.car ? (
                  <span>{review.car.brand} {review.car.model}</span>
                ) : (
                  <span>{review.reviewee?.full_name || "Unknown"}</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </TableCell>
            <TableCell className="max-w-[200px]">
              <p className="text-sm text-muted-foreground truncate">
                {review.comment || "No comment"}
              </p>
            </TableCell>
            <TableCell>{getTypeBadge(review.review_type)}</TableCell>
            <TableCell>{getStatusBadge(review.status)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(review.created_at), "MMM d, yyyy")}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={updatingId === review.id}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(review)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {review.status !== "published" && (
                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "published")}>
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </DropdownMenuItem>
                  )}
                  {review.status !== "flagged" && (
                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "flagged")}>
                      <Flag className="h-4 w-4 mr-2" />
                      Flag
                    </DropdownMenuItem>
                  )}
                  {review.status !== "hidden" && (
                    <DropdownMenuItem onClick={() => updateReviewStatus(review.id, "hidden")}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => deleteReview(review.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
