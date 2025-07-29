import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, Calendar, MapPin, Star } from "lucide-react";
import { UserEditDialog } from "../UserEditDialog";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin";
  phone_number: string | null;
  created_at: string;
  avatar_url: string | null;
  latitude?: number;
  longitude?: number;
  is_sharing_location?: boolean;
  location_sharing_scope?: string;
}

interface UserOverviewTabProps {
  user: Profile;
  onUpdate?: () => void;
}

const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};

const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ["user-stats", userId],
    queryFn: async () => {
      // Get booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("status")
        .eq("renter_id", userId);

      if (bookingsError) throw bookingsError;

      // Get hosted cars count
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", userId);

      if (carsError) throw carsError;

      // Get reviews received
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", userId);

      if (reviewsError) throw reviewsError;

      const totalBookings = bookings?.length || 0;
      const completedBookings = bookings?.filter(b => b.status === "completed").length || 0;
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      return {
        totalBookings,
        completedBookings,
        hostedCars: cars?.length || 0,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews?.length || 0,
      };
    },
  });
};

export const UserOverviewTab = ({ user, onUpdate }: UserOverviewTabProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data: profile, isLoading: profileLoading } = useUserProfile(user.id);
  const { data: stats, isLoading: statsLoading } = useUserStats(user.id);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "host": return "default";
      case "renter": return "secondary";
      default: return "outline";
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate?.();
  };

  return (
    <>
      <div className="space-y-6">
        {/* User Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-lg">
                    {user.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{user.full_name || "Unnamed User"}</h2>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    {profile?.is_sharing_location && (
                      <Badge variant="outline" className="text-green-600">
                        Location Sharing
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {stats?.averageRating > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{stats.averageRating} ({stats.totalReviews} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone_number || "Not provided"}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>Email not available</span>
            </div>
            {profile?.latitude && profile?.longitude && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  Location: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                  {profile.location_sharing_scope && (
                    <Badge variant="outline" className="ml-2">
                      {profile.location_sharing_scope}
                    </Badge>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {statsLoading ? "..." : stats?.totalBookings || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {statsLoading ? "..." : stats?.completedBookings || 0}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statsLoading ? "..." : stats?.hostedCars || 0}
              </div>
              <div className="text-sm text-muted-foreground">Cars Hosted</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statsLoading ? "..." : stats?.averageRating || "0.0"}
              </div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditDialogOpen && (
        <UserEditDialog
          user={user}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};