import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Shield, ShieldOff, Edit, Trash2, Plus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logUserRestrictionUpdated, logUserRestrictionRemoved, logUserRestrictionCreated } from "@/utils/auditLogger";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin";
  phone_number: string | null;
  created_at: string;
}

interface UserRestriction {
  id: string;
  user_id: string;
  restriction_type: 'login_block' | 'booking_block' | 'messaging_block' | 'suspension';
  reason: string;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UserRestrictionsTabProps {
  user: Profile;
  onUpdate?: () => void;
}

const useUserRestrictions = (userId: string) => {
  return useQuery({
    queryKey: ["user-restrictions", userId],
    queryFn: async (): Promise<UserRestriction[]> => {
      const { data, error } = await supabase
        .from("user_restrictions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const UserRestrictionsTab = ({ user, onUpdate }: UserRestrictionsTabProps) => {
  const queryClient = useQueryClient();
  const [selectedRestriction, setSelectedRestriction] = useState<UserRestriction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    reason: "",
    ends_at: "",
  });
  const [addForm, setAddForm] = useState({
    restriction_type: "" as UserRestriction['restriction_type'],
    reason: "",
    ends_at: "",
  });

  const { data: restrictions, isLoading } = useUserRestrictions(user.id);

  const updateRestrictionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UserRestriction> }) => {
      const { error } = await supabase
        .from("user_restrictions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-restrictions", user.id] });
      toast.success("Restriction updated successfully");
      onUpdate?.();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error updating restriction:", error);
      toast.error("Failed to update restriction");
    },
  });

  const removeRestrictionMutation = useMutation({
    mutationFn: async (restrictionId: string) => {
      const { error } = await supabase
        .from("user_restrictions")
        .update({ active: false })
        .eq("id", restrictionId);

      if (error) throw error;
    },
    onSuccess: (_, restrictionId) => {
      const restriction = restrictions?.find(r => r.id === restrictionId);
      if (restriction) {
        logUserRestrictionRemoved(
          user.id,
          restrictionId,
          restriction.restriction_type,
          "Admin removed restriction",
          undefined // Will use current session user
        );
      }
      queryClient.invalidateQueries({ queryKey: ["user-restrictions", user.id] });
      toast.success("Restriction removed successfully");
      onUpdate?.();
      setIsRemoveDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error removing restriction:", error);
      toast.error("Failed to remove restriction");
    },
  });

  const addRestrictionMutation = useMutation({
    mutationFn: async (restrictionData: Omit<UserRestriction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from("user_restrictions")
        .insert({
          ...restrictionData,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: async () => {
      // Write audit log for creation
      try {
        await logUserRestrictionCreated(
          user.id,
          addForm.restriction_type,
          addForm.reason,
          (await supabase.auth.getUser()).data.user?.id || undefined
        );
      } catch (e) {
        console.warn("Failed to log audit event for restriction creation", e);
      }

      queryClient.invalidateQueries({ queryKey: ["user-restrictions", user.id] });
      toast.success("Restriction added successfully");
      onUpdate?.();
      setIsAddDialogOpen(false);
      setAddForm({ restriction_type: "" as UserRestriction['restriction_type'], reason: "", ends_at: "" });
    },
    onError: (error) => {
      console.error("Error adding restriction:", error);
      toast.error("Failed to add restriction");
    },
  });

  const getRestrictionTypeLabel = (type: string) => {
    switch (type) {
      case 'login_block': return 'Login Block';
      case 'booking_block': return 'Booking Block';
      case 'messaging_block': return 'Messaging Block';
      case 'suspension': return 'Account Suspension';
      default: return type;
    }
  };

  const getRestrictionTypeColor = (type: string) => {
    switch (type) {
      case 'login_block': return 'destructive';
      case 'booking_block': return 'destructive';
      case 'messaging_block': return 'secondary';
      case 'suspension': return 'destructive';
      default: return 'outline';
    }
  };

  const handleEditRestriction = (restriction: UserRestriction) => {
    setSelectedRestriction(restriction);
    setEditForm({
      reason: restriction.reason,
      ends_at: restriction.ends_at || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleRemoveRestriction = (restriction: UserRestriction) => {
    setSelectedRestriction(restriction);
    setIsRemoveDialogOpen(true);
  };

  const handleUpdateRestriction = async () => {
    if (!selectedRestriction) return;

    const oldData = {
      reason: selectedRestriction.reason,
      ends_at: selectedRestriction.ends_at,
    };

    const newData = {
      reason: editForm.reason,
      ends_at: editForm.ends_at || null,
    };

    await updateRestrictionMutation.mutateAsync({
      id: selectedRestriction.id,
      updates: newData,
    });

    // Log the audit event
    await logUserRestrictionUpdated(
      user.id,
      selectedRestriction.id,
      oldData,
      newData,
      "Admin updated restriction",
      undefined // Will use current session user
    );
  };

  const handleAddRestriction = async () => {
    if (!addForm.restriction_type || !addForm.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    await addRestrictionMutation.mutateAsync({
      restriction_type: addForm.restriction_type,
      reason: addForm.reason,
      active: true,
      starts_at: new Date().toISOString(),
      ends_at: addForm.ends_at || null,
      created_by: (await supabase.auth.getUser()).data.user?.id || "",
    });
  };

  const activeRestrictions = restrictions?.filter(r => r.active) || [];
  const inactiveRestrictions = restrictions?.filter(r => !r.active) || [];

  return (
    <div className="space-y-6">
      {/* Active Restrictions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Active Restrictions</span>
            {activeRestrictions.length > 0 && (
              <Badge variant="destructive">{activeRestrictions.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Restriction
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading restrictions...</div>
          ) : activeRestrictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active restrictions for this user
            </div>
          ) : (
            <div className="space-y-4">
              {activeRestrictions.map((restriction) => (
                <div key={restriction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRestrictionTypeColor(restriction.restriction_type)}>
                        {getRestrictionTypeLabel(restriction.restriction_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Created {format(new Date(restriction.created_at), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm">{restriction.reason}</p>
                    {restriction.ends_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(new Date(restriction.ends_at), "PPP 'at' p")}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRestriction(restriction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveRestriction(restriction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Restrictions */}
      {inactiveRestrictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShieldOff className="h-5 w-5" />
              <span>Inactive Restrictions</span>
              <Badge variant="outline">{inactiveRestrictions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inactiveRestrictions.map((restriction) => (
                <div key={restriction.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {getRestrictionTypeLabel(restriction.restriction_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Removed {format(new Date(restriction.updated_at), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm">{restriction.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Restriction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restriction</DialogTitle>
            <DialogDescription>
              Update the restriction details for {user.full_name || "this user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-reason">Reason</Label>
              <Textarea
                id="edit-reason"
                value={editForm.reason}
                onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for restriction"
              />
            </div>
            <div>
              <Label htmlFor="edit-ends-at">Expiration Date (Optional)</Label>
              <Input
                id="edit-ends-at"
                type="datetime-local"
                value={editForm.ends_at}
                onChange={(e) => setEditForm(prev => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRestriction} disabled={updateRestrictionMutation.isPending}>
              {updateRestrictionMutation.isPending ? "Updating..." : "Update Restriction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Restriction Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Restriction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this restriction? This action will deactivate the restriction but keep it in the history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRestriction && removeRestrictionMutation.mutate(selectedRestriction.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Remove Restriction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Restriction Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Restriction</DialogTitle>
            <DialogDescription>
              Add a new restriction for {user.full_name || "this user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-type">Restriction Type</Label>
              <Select
                value={addForm.restriction_type}
                onValueChange={(value: UserRestriction['restriction_type']) =>
                  setAddForm(prev => ({ ...prev, restriction_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select restriction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="login_block">Login Block</SelectItem>
                  <SelectItem value="booking_block">Booking Block</SelectItem>
                  <SelectItem value="messaging_block">Messaging Block</SelectItem>
                  <SelectItem value="suspension">Account Suspension</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-reason">Reason</Label>
              <Textarea
                id="add-reason"
                value={addForm.reason}
                onChange={(e) => setAddForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for restriction"
              />
            </div>
            <div>
              <Label htmlFor="add-ends-at">Expiration Date (Optional)</Label>
              <Input
                id="add-ends-at"
                type="datetime-local"
                value={addForm.ends_at}
                onChange={(e) => setAddForm(prev => ({ ...prev, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRestriction} disabled={addRestrictionMutation.isPending}>
              {addRestrictionMutation.isPending ? "Adding..." : "Add Restriction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
