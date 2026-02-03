import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReviewStatsCards } from "@/components/admin/ReviewStatsCards";
import { ReviewManagementTable } from "@/components/admin/ReviewManagementTable";
import { ReviewDetailsDialog } from "@/components/admin/ReviewDetailsDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type ReviewWithDetails = {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  car_id: string | null;
  rating: number;
  comment: string | null;
  review_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  reviewer: { full_name: string | null; avatar_url: string | null } | null;
  reviewee: { full_name: string | null } | null;
  car: { brand: string; model: string } | null;
};

const AdminReviews = () => {
  const [selectedReview, setSelectedReview] = useState<ReviewWithDetails | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", typeFilter, statusFilter, ratingFilter],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          reviewer:profiles!reviewer_id(full_name, avatar_url),
          reviewee:profiles!reviewee_id(full_name),
          car:cars!car_id(brand, model)
        `)
        .order("created_at", { ascending: false });

      if (typeFilter !== "all") {
        query = query.eq("review_type", typeFilter as "car" | "host_to_renter" | "renter" | "renter_to_host");
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (ratingFilter !== "all") {
        query = query.eq("rating", parseInt(ratingFilter));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ReviewWithDetails[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-review-stats"],
    queryFn: async () => {
      const { data: allReviews, error } = await supabase
        .from("reviews")
        .select("rating, status, created_at");
      
      if (error) throw error;

      const { count: completedBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      const totalReviews = allReviews?.length || 0;
      const avgRating = totalReviews > 0 
        ? allReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews 
        : 0;
      const pendingModeration = allReviews?.filter(r => r.status === "pending").length || 0;
      const flaggedReviews = allReviews?.filter(r => r.status === "flagged").length || 0;
      const reviewRate = completedBookings && completedBookings > 0 
        ? ((totalReviews / completedBookings) * 100).toFixed(1) 
        : "0";

      // This month's reviews
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthReviews = allReviews?.filter(
        r => new Date(r.created_at) >= startOfMonth
      ).length || 0;

      return {
        totalReviews,
        avgRating: avgRating.toFixed(1),
        pendingModeration,
        flaggedReviews,
        reviewRate,
        thisMonthReviews,
      };
    },
  });

  const filteredReviews = reviews?.filter(review => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.reviewer?.full_name?.toLowerCase().includes(query) ||
      review.reviewee?.full_name?.toLowerCase().includes(query) ||
      review.car?.brand?.toLowerCase().includes(query) ||
      review.car?.model?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query)
    );
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Reviews Management</h1>
              <p className="text-muted-foreground">
                View and moderate all reviews across the platform
              </p>
            </div>

            <ReviewStatsCards stats={stats} />

            <Card>
              <CardHeader>
                <CardTitle>All Reviews</CardTitle>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="car">Car Reviews</SelectItem>
                      <SelectItem value="host_to_renter">Host → Renter</SelectItem>
                      <SelectItem value="renter_to_host">Renter → Host</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ReviewManagementTable 
                  reviews={filteredReviews || []} 
                  isLoading={isLoading}
                  onViewDetails={setSelectedReview}
                  onRefetch={refetch}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ReviewDetailsDialog 
        review={selectedReview} 
        onClose={() => setSelectedReview(null)}
        onRefetch={refetch}
      />
    </SidebarProvider>
  );
};

export default AdminReviews;
