import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Shield, UserCheck, UserX, Crown } from "lucide-react";
import { toast } from "sonner";
import { logAdminLogin, logAdminLogout } from "@/utils/auditLogger";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin" | "super_admin";
  phone_number: string | null;
  created_at: string;
  avatar_url: string | null;
  email?: string;
}

interface UserAdminTabProps {
  user: Profile;
  onUpdate?: () => void;
}

const useAdminStatus = (userId: string) => {
  return useQuery({
    queryKey: ["admin-status", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .eq("id", userId)
        .single();
      
      return error ? null : data;
    },
  });
};

export const UserAdminTab = ({ user, onUpdate }: UserAdminTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const { data: adminData, isLoading } = useAdminStatus(user.id);

  const addAdminMutation = useMutation({
    mutationFn: async ({ isSuperAdmin }: { isSuperAdmin: boolean }) => {
      const { error } = await supabase
        .from("admins")
        .insert({
          id: user.id,
          email: user.email || `${user.id}@placeholder.com`, // Use actual email or fallback
          full_name: user.full_name,
          is_super_admin: isSuperAdmin,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-status", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User added as admin successfully");
      onUpdate?.();
      setShowAddDialog(false);
    },
    onError: (error) => {
      console.error("Error adding admin:", error);
      toast.error("Failed to add user as admin");
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-status", user.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Admin access removed successfully");
      onUpdate?.();
      setShowRemoveDialog(false);
    },
    onError: (error) => {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin access");
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ isSuperAdmin }: { isSuperAdmin: boolean }) => {
      const { error } = await supabase
        .from("admins")
        .update({ is_super_admin: isSuperAdmin })
        .eq("id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-status", user.id] });
      toast.success("Admin privileges updated successfully");
      onUpdate?.();
    },
    onError: (error) => {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin privileges");
    },
  });

  const handleAddAdmin = () => {
    addAdminMutation.mutate({ isSuperAdmin });
  };

  const handleRemoveAdmin = () => {
    removeAdminMutation.mutate();
  };

  const handleToggleSuperAdmin = (checked: boolean) => {
    updateAdminMutation.mutate({ isSuperAdmin: checked });
  };

  const handleViewAdminManagement = () => {
    navigate(`/admin/management?user=${user.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Admin Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Admin Access Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-muted">
                  {adminData ? (
                    <UserCheck className="h-5 w-5 text-green-600" />
                  ) : (
                    <UserX className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">Admin Access</h4>
                  <p className="text-sm text-muted-foreground">
                    {adminData ? "User has admin access" : "User does not have admin access"}
                  </p>
                </div>
              </div>
              <Badge variant={adminData ? "default" : "outline"}>
                {adminData ? "Admin" : "No Access"}
              </Badge>
            </div>

            {adminData && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Crown className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Super Admin</h4>
                    <p className="text-sm text-muted-foreground">
                      Can manage other admins and system settings
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={adminData.is_super_admin || false}
                    onCheckedChange={handleToggleSuperAdmin}
                    disabled={updateAdminMutation.isPending}
                  />
                  <Badge variant={adminData.is_super_admin ? "destructive" : "outline"}>
                    {adminData.is_super_admin ? "Super Admin" : "Regular Admin"}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Details */}
      {adminData && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Added:</span>
              <span>{new Date(adminData.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(adminData.updated_at).toLocaleString()}</span>
            </div>
            {adminData.last_sign_in_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Sign In:</span>
                <span>{new Date(adminData.last_sign_in_at).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!adminData ? (
            <Button 
              onClick={() => setShowAddDialog(true)}
              disabled={addAdminMutation.isPending}
              className="w-full"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              {addAdminMutation.isPending ? "Adding..." : "Add as Admin"}
            </Button>
          ) : (
            <Button 
              variant="destructive"
              onClick={() => setShowRemoveDialog(true)}
              disabled={removeAdminMutation.isPending}
              className="w-full"
            >
              <UserX className="h-4 w-4 mr-2" />
              {removeAdminMutation.isPending ? "Removing..." : "Remove Admin Access"}
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={handleViewAdminManagement}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            View in Admin Management
          </Button>
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to give {user.full_name || "this user"} admin access to the platform?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="super-admin"
                checked={isSuperAdmin}
                onCheckedChange={setIsSuperAdmin}
              />
              <label htmlFor="super-admin" className="text-sm font-medium">
                Make Super Admin (can manage other admins)
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddAdmin}>
              Add Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Admin Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for {user.full_name || "this user"}? 
              This will revoke all admin privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAdmin} className="bg-destructive text-destructive-foreground">
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};