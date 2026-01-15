import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Shield,
  Ban,
  UserX,
  Trash2,
  Mail,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminUserComplete } from "@/hooks/useAdminUsersComplete";

interface UserActionsDropdownProps {
  user: AdminUserComplete;
  onViewDetails: (user: AdminUserComplete) => void;
  onEditUser: (user: AdminUserComplete) => void;
}

type UserRole = "renter" | "host" | "admin" | "super_admin";

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onViewDetails,
  onEditUser,
}) => {
  const queryClient = useQueryClient();
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("renter");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendType, setSuspendType] = useState<"suspend" | "ban">("suspend");
  const [deleteReason, setDeleteReason] = useState("");

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const { data, error } = await supabase.functions.invoke("assign-role", {
        body: { userId, role },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Role assigned successfully");
      setIsRoleDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users-complete"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("suspend-user", {
        body: {
          userId: user.id,
          restrictionType: suspendType,
          reason: suspendReason,
          duration: suspendType === "ban" ? "permanent" : "days",
          durationValue: 7,
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(suspendType === "ban" ? "User banned" : "User suspended");
      setIsSuspendDialogOpen(false);
      setSuspendReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users-complete"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${suspendType} user: ${error.message}`);
    },
  });

  const removeRestrictionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("user_restrictions")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Restriction removed");
      queryClient.invalidateQueries({ queryKey: ["admin-users-complete"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove restriction: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("delete-user-with-transfer", {
        body: { userId: user.id, reason: deleteReason },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("User deleted");
      setIsDeleteDialogOpen(false);
      setDeleteReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-users-complete"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error("No active session");

      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { userId: user.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Password reset email sent");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send reset email: ${error.message}`);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => onViewDetails(user)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => onEditUser(user)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Assign Role
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => resetPasswordMutation.mutate()}>
            <Mail className="h-4 w-4 mr-2" />
            Reset Password
          </DropdownMenuItem>

          {user.is_restricted ? (
            <DropdownMenuItem onClick={() => removeRestrictionMutation.mutate()}>
              <UserCheck className="h-4 w-4 mr-2" />
              Remove Restriction
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setSuspendType("suspend");
                setIsSuspendDialogOpen(true);
              }}
            >
              <UserX className="h-4 w-4 mr-2" />
              Suspend User
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem
            onClick={() => {
              setSuspendType("ban");
              setIsSuspendDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="h-4 w-4 mr-2" />
            Ban User
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Assign Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a new role to {user.full_name || user.email || "this user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renter">Renter</SelectItem>
                  <SelectItem value="host">Host</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => assignRoleMutation.mutate({ userId: user.id, role: selectedRole })}
              disabled={assignRoleMutation.isPending}
            >
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Ban Dialog */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{suspendType === "ban" ? "Ban User" : "Suspend User"}</DialogTitle>
            <DialogDescription>
              {suspendType === "ban"
                ? "This will permanently ban the user from the platform."
                : "This will temporarily suspend the user for 7 days."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for this action..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => suspendMutation.mutate()}
              disabled={!suspendReason.trim() || suspendMutation.isPending}
            >
              {suspendMutation.isPending
                ? "Processing..."
                : suspendType === "ban"
                ? "Ban User"
                : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All user data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for deletion</Label>
              <Input
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Test account cleanup, User request, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={!deleteReason.trim() || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
