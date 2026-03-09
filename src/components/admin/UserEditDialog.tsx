import React from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { logUserProfileUpdated } from "@/utils/auditLogger";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin" | "super_admin";
  phone_number: string | null;
  created_at: string;
}

interface UserEditDialogProps {
  user: Profile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserEditDialog = ({ user, isOpen, onClose, onSuccess }: UserEditDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState(user.role);
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const oldData = {
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
      };

      const newData = {
        full_name: fullName.trim() || null,
        role,
        phone_number: phoneNumber.trim() || null,
      };

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update(newData)
        .eq("id", user.id);

      if (error) throw error;

      // MOB-104: Sync user_roles table when role changes
      if (role !== user.role) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .upsert(
            { user_id: user.id, role },
            { onConflict: "user_id" }
          );

        if (roleError) {
          console.error("Failed to sync user_roles:", roleError);
          // Non-blocking: profile was updated, warn about role sync
          toast.warning("Profile updated but role sync to user_roles failed");
        }
      }

      await logUserProfileUpdated(user.id, oldData, newData);

      onSuccess();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] border border-blue-200">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: "renter" | "host" | "admin" | "super_admin") => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="renter">Renter</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
