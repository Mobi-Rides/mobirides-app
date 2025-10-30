import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, UserX, UserCheck, Trash2, Shield, Mail, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import type { Database } from "@/integrations/supabase/types";

interface UserProfile {
  id: string;
  email?: string;
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
  duration: "hours" | "days" | "weeks" | "months" | "permanent";
  durationValue: number;
}

const useUsers = () => {
  return useQuery<UserProfile[], Error>({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserProfile[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone_number,
          role,
          created_at,
          last_sign_in_at
        `)
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRestrictions = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: restrictions } = await supabase
            .from("user_restrictions")
            .select("*")
            .eq("user_id", profile.id)
            .eq("active", true);

          const { count: vehiclesCount } = await supabase
            .from("cars")
            .select("id", { count: "exact", head: true })
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

export const AdvancedUserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isVehicleWarningDialogOpen, setIsVehicleWarningDialogOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [restrictionForm, setRestrictionForm] = useState<RestrictionFormData>({
    restrictionType: "suspend",
    reason: "",
    duration: "days",
    durationValue: 7,
  });

  const queryClient = useQueryClient();
  const { data: users, isLoading, error } = useUsers();
  const { isSuperAdmin } = useIsAdmin();

  const restrictUserMutation = useMutation({
    mutationFn: async ({ userId, restriction }: { userId: string; restriction: RestrictionFormData }) => {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("No active session. Please sign in again.");
      }

      const { data, error } = await supabase.functions.invoke('suspend-user', {
        body: {
          userId,
          restrictionType: restriction.restrictionType,
          reason: restriction.reason,
          duration: restriction.duration,
          durationValue: restriction.durationValue,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        let parsed: { error?: string; code?: string; details?: string } | null = null;
        try {
          const resp = error?.context?.response as Response | undefined;
          if (resp) {
            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              parsed = await resp.json();
            } else {
              const text = await resp.text();
              try { parsed = JSON.parse(text); } catch { /* ignore parse error */ }
            }
          }
        } catch (parseErr) {
          console.warn('Failed to parse function error response', parseErr);
        }

        const msg = parsed?.error || error.message || "Failed to restrict user. Please try again.";
        const composed = [
          msg,
          parsed?.code ? `(code: ${parsed.code})` : null,
          parsed?.details ? `details: ${parsed.details}` : null,
        ].filter(Boolean).join(' ');
        throw new Error(composed);
      }

      if (data?.error) {
        const composed = [
          data.error,
          data.code ? `(code: ${data.code})` : null,
          data.details ? `details: ${data.details}` : null,
        ].filter(Boolean).join(' ');
        throw new Error(composed);
      }

      return data;
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

  const removeRestrictionMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_restrictions")
        .update({ active: false } as Database["public"]["Tables"]["user_restrictions"]["Update"])
        .eq("user_id", userId)
        .eq("active", true);

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

  // Add this to your AdvancedUserManagement component to replace the deleteUserMutation
const deleteUserMutation = useMutation({
  mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
    console.log("🔍 Starting delete user mutation...");
    console.log("User ID:", userId);
    console.log("Reason:", reason);

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    console.log("Session data:", sessionData ? "✅ Found" : "❌ Missing");
    
    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      console.error("❌ No access token found");
      throw new Error("No active session. Please sign in again.");
    }

    console.log("✅ Access token found:", accessToken.substring(0, 20) + "...");

    // Prepare function call
    console.log("Request body:", { userId, reason });

    try {
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('delete-user-with-transfer', {
        body: { userId, reason },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("📥 Function response received");
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) {
        console.error("❌ Edge function returned error:", error);
        
        // Try to parse error details
        let parsed: { error?: string; code?: string; details?: string } | null = null;
        try {
          const resp = error?.context?.response as Response | undefined;
          if (resp) {
            console.log("Response status:", resp.status);
            console.log("Response headers:", Object.fromEntries(resp.headers.entries()));
            
            const contentType = resp.headers.get('content-type') || '';
            console.log("Content-Type:", contentType);
            
            if (contentType.includes('application/json')) {
              parsed = await resp.json();
              console.log("Parsed error response:", parsed);
            } else {
              const text = await resp.text();
              console.log("Text response:", text);
              try { 
                parsed = JSON.parse(text); 
                console.log("Parsed text as JSON:", parsed);
              } catch { 
                console.log("Could not parse text as JSON");
              }
            }
          }
        } catch (parseErr) {
          console.error('❌ Failed to parse function error response', parseErr);
        }

        const msg = parsed?.error || error.message || "Failed to delete user. Please try again.";
        const composed = [
          msg,
          parsed?.code ? `(code: ${parsed.code})` : null,
          parsed?.details ? `details: ${parsed.details}` : null,
        ].filter(Boolean).join(' ');
        
        console.error("❌ Final error message:", composed);
        throw new Error(composed);
      }

      if (data?.error) {
        console.error("❌ Data contains error:", data);
        const composed = [
          data.error,
          data.code ? `(code: ${data.code})` : null,
          data.details ? `details: ${data.details}` : null,
        ].filter(Boolean).join(' ');
        throw new Error(composed);
      }

      console.log("✅ Delete user successful!");
      return data;
    } catch (err) {
      console.error("❌ Exception during function call:", err);
      throw err;
    }
  },
  onSuccess: (data) => {
    console.log("✅ Mutation success callback:", data);
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    toast.success("User deleted successfully");
    setIsDeleteDialogOpen(false);
    setIsVehicleWarningDialogOpen(false);
    setDeletionReason("");
    setSelectedUser(null);
  },
  onError: (error: Error) => {
    console.error("❌ Mutation error callback:", error);
    toast.error(`Failed to delete user: ${error.message}`);
  },
});

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        throw new Error("No active session. Please sign in again.");
      }

      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        console.error("Edge function error:", error);
        let parsed: { error?: string; code?: string; details?: string } | null = null;
        try {
          const resp = error?.context?.response as Response | undefined;
          if (resp) {
            const contentType = resp.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              parsed = await resp.json();
            } else {
              const text = await resp.text();
              try { parsed = JSON.parse(text); } catch { /* ignore parse error */ }
            }
          }
        } catch (parseErr) {
          console.warn('Failed to parse function error response', parseErr);
        }

        const msg = parsed?.error || error.message || "Failed to send password reset. Please try again.";
        const composed = [
          msg,
          parsed?.code ? `(code: ${parsed.code})` : null,
          parsed?.details ? `details: ${parsed.details}` : null,
        ].filter(Boolean).join(' ');
        throw new Error(composed);
      }

      if (data?.error) {
        const composed = [
          data.error,
          data.code ? `(code: ${data.code})` : null,
          data.details ? `details: ${data.details}` : null,
        ].filter(Boolean).join(' ');
        throw new Error(composed);
      }

      return data;
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
    resetRestrictionForm();
    setIsRestrictionDialogOpen(true);
  };

  const handleRemoveRestriction = (user: UserProfile) => {
    removeRestrictionMutation.mutate(user.id);
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeletionReason("");
    
    // If user has vehicles, show warning first
    if (user.vehicles_count > 0) {
      setIsVehicleWarningDialogOpen(true);
    } else {
      // If no vehicles, go directly to delete confirmation
      setIsDeleteDialogOpen(true);
    }
  };

  const handleResetPassword = (user: UserProfile) => {
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
    if (!selectedUser || !deletionReason.trim()) return;
    deleteUserMutation.mutate({
      userId: selectedUser.id,
      reason: deletionReason.trim(),
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
                          {user.email || "No email"}
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
                          {`Restricted (${user.restrictions?.length ?? 0})`}
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
                        <div>{user.vehicles_count} vehicles</div>
                        <div>{user.bookings_count} bookings</div>
                        <div>{user.reviews_count} reviews</div>
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
                        {isSuperAdmin && (
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
                        )}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restrict User Access</DialogTitle>
            <DialogDescription>
              Apply a restriction to {selectedUser?.full_name}. This will limit their access to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="restrictionType">Restriction Type</Label>
              <Select
                value={restrictionForm.restrictionType}
                onValueChange={(value: "suspend" | "ban") =>
                  setRestrictionForm({ ...restrictionForm, restrictionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspend">Suspend (Temporary Access Removal)</SelectItem>
                  <SelectItem value="ban">Ban (Permanent Access Removal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (Required for Audit)</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for this restriction..."
                value={restrictionForm.reason}
                onChange={(e) =>
                  setRestrictionForm({ ...restrictionForm, reason: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={restrictionForm.duration}
                  onValueChange={(value: RestrictionFormData["duration"]) =>
                    setRestrictionForm({ ...restrictionForm, duration: value })
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
              <div className="grid gap-2">
                <Label htmlFor="durationValue">Value</Label>
                <Input
                  id="durationValue"
                  type="number"
                  min="1"
                  value={restrictionForm.durationValue}
                  onChange={(e) =>
                    setRestrictionForm({
                      ...restrictionForm,
                      durationValue: parseInt(e.target.value) || 1,
                    })
                  }
                  disabled={restrictionForm.duration === "permanent"}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRestrictionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRestriction}
              disabled={!restrictionForm.reason.trim() || restrictUserMutation.isPending}
            >
              Apply Restriction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Warning Dialog */}
      <Dialog open={isVehicleWarningDialogOpen} onOpenChange={setIsVehicleWarningDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Vehicle Transfer Required
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p className="font-medium">
                {selectedUser?.full_name} has {selectedUser?.vehicles_count} vehicle(s) registered.
              </p>
              <p>
                Before deleting this user, you must transfer their vehicles to another user. 
                Please go to the <span className="font-semibold">Cars</span> section in the dashboard 
                to transfer the vehicles first.
              </p>
              <p className="text-sm text-muted-foreground">
                Once all vehicles are transferred, you can proceed with user deletion.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsVehicleWarningDialogOpen(false);
                setSelectedUser(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsVehicleWarningDialogOpen(false);
                setIsDeleteDialogOpen(true);
              }}
              className="w-full sm:w-auto"
            >
              Continue Anyway (Not Recommended)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User Account
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p className="font-medium text-red-600">
                This action cannot be undone!
              </p>
              <p>
                You are about to permanently delete <span className="font-semibold">{selectedUser?.full_name}</span>'s account.
              </p>
              <p>This will delete:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>User profile and authentication</li>
                <li>All bookings ({selectedUser?.bookings_count || 0})</li>
                <li>All reviews ({selectedUser?.reviews_count || 0})</li>
                <li>All restrictions and history</li>
                {selectedUser?.vehicles_count && selectedUser.vehicles_count > 0 && (
                  <li className="text-orange-600 font-semibold">
                    {selectedUser.vehicles_count} vehicle(s) - These will be permanently deleted!
                  </li>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deletionReason">Deletion Reason (Required)</Label>
              <Textarea
                id="deletionReason"
                placeholder="Enter the reason for deleting this user account..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged for audit purposes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletionReason("");
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deletionReason.trim() || deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};