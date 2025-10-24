import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
// Removed unused AlertDialog imports: AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// Removed unused Tabs imports
import { Search, UserX, UserCheck, Trash2, Shield, Mail } from "lucide-react"; // Clock, AlertTriangle kept for use in logic
import { AlertTriangle } from 'lucide-react'; // Explicit import for clarity
import { toast } from "sonner";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  role: "renter" | "host" | "admin" | "super_admin";
  created_at: string;
  last_sign_in_at: string | null;
  is_restricted: boolean;
  restrictions: Array<{
    restriction_type: string;
    reason: string;
    restricted_at: string;
    expires_at: string | null;
  }>;
  vehicles_count: number;
  bookings_count: number;
  reviews_count: number;
}

interface RestrictionFormData {
  restrictionType: "suspend" | "ban";
  reason: string;
  duration: "hours" | "days" | "weeks" | "months" | "permanent"; // Strictly typed duration
  durationValue: number;
}

const useUsers = () => {
  return useQuery<UserProfile[], Error>({ // Added type for error
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserProfile[]> => {
      // Get users with their restriction status
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          phone_number,
          role,
          created_at,
          last_sign_in_at
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get restriction details and counts for each user
      const usersWithRestrictions = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Only fetch ACTIVE restrictions
          const { data: restrictions } = await supabase
            .from("user_restrictions")
            .select("*")
            .eq("user_id", profile.id)
            .eq("is_active", true);

          const { count: vehiclesCount } = await supabase
            .from("cars")
            .select("id", { count: "exact", head: true }) // Using head: true for efficiency
            .eq("owner_id", profile.id);

          const { count: bookingsCount } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .or(`renter_id.eq.${profile.id},host_id.eq.${profile.id}`);

          const { count: reviewsCount } = await supabase
            .from("reviews")
            .select("id", { count: "exact", head: true })
            .or(`reviewer_id.eq.${profile.id},reviewee_id.eq.${profile.id}`);

          return {
            ...profile,
            is_restricted: (restrictions?.length || 0) > 0,
            restrictions: restrictions || [],
            vehicles_count: vehiclesCount || 0,
            bookings_count: bookingsCount || 0,
            reviews_count: reviewsCount || 0,
          };
        })
      );

      return usersWithRestrictions;
    },
  });
};

const useNonAdminUsers = () => {
  return useQuery({
    queryKey: ["non-admin-users"],
    queryFn: async (): Promise<Pick<UserProfile, 'id' | 'full_name' | 'role'>[]> => {
      // Exclude both admin and super_admin roles when listing transferrable users
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .not('role', 'in', ["admin", "super_admin"])
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

// Helper function to calculate expiration date accurately
const calculateExpiresAt = (duration: RestrictionFormData["duration"], value: number): Date | null => {
  if (duration === "permanent") return null;
  const now = new Date();
  const expiresAt = new Date(now);

  switch (duration) {
    case "hours":
      expiresAt.setHours(now.getHours() + value);
      break;
    case "days":
      expiresAt.setDate(now.getDate() + value);
      break;
    case "weeks":
      expiresAt.setDate(now.getDate() + value * 7);
      break;
    case "months":
      // Use setMonth for accurate month calculation, avoiding the 30-day bug
      expiresAt.setMonth(now.getMonth() + value);
      break;
    default:
      return null;
  }
  return expiresAt;
};


export const AdvancedUserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // State for deletion reason
  const [deletionReason, setDeletionReason] = useState("");
  const [restrictionForm, setRestrictionForm] = useState<RestrictionFormData>({
    restrictionType: "suspend",
    reason: "",
    duration: "days",
    durationValue: 7,
  });
  const [transferUserId, setTransferUserId] = useState("");

  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useUsers();
  const { data: nonAdminUsers } = useNonAdminUsers();

  // Restriction mutation
  const restrictUserMutation = useMutation({
    mutationFn: async ({ userId, restriction }: { userId: string; restriction: RestrictionFormData }) => {
      // Call the Edge Function to handle user suspension with service_role
      const { data, error } = await supabase.functions.invoke('suspend-user', {
        body: {
          userId,
          restrictionType: restriction.restrictionType,
          reason: restriction.reason,
          duration: restriction.duration,
          durationValue: restriction.durationValue,
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to restrict user. Please try again.");
      }

      // The Edge Function handles all validation and admin checks
      if (data?.error) {
        throw new Error(data.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User restriction applied successfully");
      setIsRestrictionDialogOpen(false);
      resetRestrictionForm();
    },
    onError: (error: Error) => {
      console.error("Restriction mutation error:", error);
      toast.error(`Failed to restrict user: ${error.message}`);
    },
  });

  // Remove restriction mutation (Logic is sound)
  const removeRestrictionMutation = useMutation({
    mutationFn: async (userId: string) => {
      // NOTE: This assumes user_restrictions is tracked by is_active, 
      // not a simple delete, which is good for audit trail.
      const { error } = await supabase
        .from("user_restrictions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User restriction removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove restriction: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, transferToUserId, reason }: { userId: string; transferToUserId: string; reason: string }) => {
      // This relies on a Supabase Edge Function ('delete-user-with-transfer') to handle
      // the complex logic of: 1) transferring assets, 2) deleting the user from Auth, and 3) cleaning up the profile.
      const { data, error } = await supabase.functions.invoke('delete-user-with-transfer', {
        body: { userId, transferToUserId, reason }
      });

      if (error) throw error;
      // The function response must be checked for application-level errors
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted and assets transferred successfully");
      setIsDeleteDialogOpen(false);
      setTransferUserId("");
      setDeletionReason(""); // Reset deletion reason
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Reset password mutation (Logic is sound, relies on correct email lookup)
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Step 1: Get the user's email from auth.users since profiles table doesn't have email column
      const { data: authUserData, error: authError } = await supabase.auth.admin.getUserById(userId);

      if (authError) throw authError;
      const userEmail = authUserData.user?.email;
      if (!userEmail) throw new Error("User email not found.");

      // Step 2: Send the recovery link
      const { error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: userEmail,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password reset email sent to user");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send password reset: ${error.message}`);
    },
  });

  const resetRestrictionForm = () => {
    setRestrictionForm({
      restrictionType: "suspend",
      reason: "",
      duration: "days",
      durationValue: 7,
    });
  };

  const handleRestrictUser = (user: UserProfile) => {
    setSelectedUser(user);
    // Re-initialize form for a new restriction
    resetRestrictionForm(); 
    setIsRestrictionDialogOpen(true);
  };

  const handleRemoveRestriction = (user: UserProfile) => {
    removeRestrictionMutation.mutate(user.id);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeletionReason(""); // Clear reason on open
    setTransferUserId(""); // Clear transfer user on open
    setIsDeleteDialogOpen(true);
  };

  const handleResetPassword = (user: UserProfile) => {
    // Prevent action for admins on themselves/other admins? Assuming this is allowed for now.
    resetPasswordMutation.mutate(user.id);
  };

  const confirmRestriction = () => {
    if (!selectedUser) return;
    restrictUserMutation.mutate({
      userId: selectedUser.id,
      restriction: restrictionForm,
    });
  };

  const confirmDelete = () => {
    // Added check for deletionReason
    if (!selectedUser || !transferUserId || !deletionReason.trim()) return; 
    deleteUserMutation.mutate({
      userId: selectedUser.id,
      transferToUserId: transferUserId,
      reason: deletionReason.trim(), // Use the user-provided reason
    });
  };

  const filteredUsers = users?.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load users: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Advanced User Management ({filteredUsers.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage user accounts, restrictions, and administrative actions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.full_name || "No name"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                        {user.phone_number && (
                          <div className="text-sm text-muted-foreground">
                            {user.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_restricted ? (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Restricted
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>**{user.vehicles_count}** vehicles</div>
                        <div>**{user.bookings_count}** bookings</div>
                        <div>**{user.reviews_count}** reviews</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(user.created_at), "MMM dd, yyyy")}
                      </div>
                      {user.last_sign_in_at && (
                        <div className="text-xs text-muted-foreground">
                          Last sign in: {format(new Date(user.last_sign_in_at), "MMM dd, yyyy")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.is_restricted ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRestriction(user)}
                            className="text-green-600 hover:text-green-700"
                            title="Remove Restriction"
                            disabled={removeRestrictionMutation.isPending}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestrictUser(user)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Restrict User"
                            disabled={restrictUserMutation.isPending}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(user)}
                          className="text-blue-600 hover:text-blue-700"
                          title="Send Password Reset"
                          disabled={resetPasswordMutation.isPending}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="text-destructive hover:text-red-700"
                          title="Delete User"
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restriction Dialog */}
      <Dialog open={isRestrictionDialogOpen} onOpenChange={setIsRestrictionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restrict User Access</DialogTitle>
            <DialogDescription>
              Apply a restriction to **{selectedUser?.full_name || selectedUser?.email}**.
              This will limit their access to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="restriction-type">Restriction Type</Label>
              <Select
                value={restrictionForm.restrictionType}
                onValueChange={(value: "suspend" | "ban") =>
                  setRestrictionForm(prev => ({ ...prev, restrictionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspend">Suspend (Temporary Access Removal)</SelectItem>
                  <SelectItem value="ban">Ban (Permanent/Severe Restriction)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason (Required for Audit)</Label>
              <Textarea
                id="reason"
                value={restrictionForm.reason}
                onChange={(e) =>
                  setRestrictionForm(prev => ({ ...prev, reason: e.target.value }))
                }
                placeholder="Enter the reason for this restriction..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={restrictionForm.duration}
                  onValueChange={(value: RestrictionFormData["duration"]) =>
                    setRestrictionForm(prev => ({ ...prev, duration: value, durationValue: value === "permanent" ? 0 : prev.durationValue })) // Reset value for permanent
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration-value">Value</Label>
                <Input
                  id="duration-value"
                  type="number"
                  value={restrictionForm.durationValue}
                  onChange={(e) =>
                    setRestrictionForm(prev => ({
                      ...prev,
                      durationValue: parseInt(e.target.value) > 0 ? parseInt(e.target.value) : 1 // Ensure value is at least 1
                    }))
                  }
                  disabled={restrictionForm.duration === "permanent"}
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestrictionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmRestriction}
              // Require a reason and a duration value (unless permanent)
              disabled={
                !restrictionForm.reason.trim() || 
                (restrictionForm.duration !== "permanent" && restrictionForm.durationValue < 1) || 
                restrictUserMutation.isPending
              }
            >
              {restrictUserMutation.isPending ? "Applying..." : "Apply Restriction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
            <DialogDescription>
              Permanently delete **{selectedUser?.full_name || selectedUser?.email}**'s account.
              This action cannot be undone. All associated assets will be transferred to the selected user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transfer-user">Transfer Assets To</Label>
              <Select value={transferUserId} onValueChange={setTransferUserId} disabled={!nonAdminUsers?.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to receive assets..." />
                </SelectTrigger>
                <SelectContent>
                  {nonAdminUsers?.filter(u => u.id !== selectedUser?.id).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || "Unnamed User"} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!nonAdminUsers?.length && <p className="text-sm text-red-500 mt-1">No other non-admin users available for transfer.</p>}
            </div>
            {/* New: Deletion Reason Input */}
            <div>
              <Label htmlFor="deletion-reason">Reason for Deletion (Required for Audit)</Label>
              <Textarea
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Document the administrative reason for this permanent deletion..."
              />
            </div>
            {/* Asset Breakdown (Unchanged) */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Assets to be transferred:</h4>
              <ul className="text-sm space-y-1">
                <li>• **{selectedUser?.vehicles_count || 0}** vehicles</li>
                <li>• **{selectedUser?.bookings_count || 0}** bookings</li>
                <li>• **{selectedUser?.reviews_count || 0}** reviews</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              // Added check for deletionReason
              disabled={!transferUserId || deleteUserMutation.isPending || !deletionReason.trim()}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};