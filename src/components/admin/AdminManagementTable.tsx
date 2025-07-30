import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Trash2, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: string;
}

const useAdmins = () => {
  return useQuery({
    queryKey: ["admins"],
    queryFn: async (): Promise<Admin[]> => {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

const useNonAdminUsers = () => {
  return useQuery({
    queryKey: ["non-admin-users"],
    queryFn: async (): Promise<Profile[]> => {
      // Get all users who are NOT in the admins table
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .not("id", "in", `(SELECT id FROM admins)`)
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const AdminManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const queryClient = useQueryClient();
  const { data: admins, isLoading, error } = useAdmins();
  const { data: nonAdminUsers } = useNonAdminUsers();

  const addAdminMutation = useMutation({
    mutationFn: async ({ userId, isSuperAdmin, userEmail, userName }: { 
      userId: string; 
      isSuperAdmin: boolean; 
      userEmail: string;
      userName: string;
    }) => {
      const { error } = await supabase
        .from("admins")
        .insert({
          id: userId,
          email: userEmail,
          full_name: userName,
          is_super_admin: isSuperAdmin
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["non-admin-users"] });
      toast.success("Admin added successfully");
      setIsAddDialogOpen(false);
      setSelectedUserId("");
      setIsSuperAdmin(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add admin: ${error.message}`);
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["non-admin-users"] });
      toast.success("Admin removed successfully");
      setAdminToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove admin: ${error.message}`);
    },
  });

  const handleAddAdmin = () => {
    if (!selectedUserId) return;
    
    const selectedUser = nonAdminUsers?.find(user => user.id === selectedUserId);
    if (!selectedUser) return;

    // For email, we'll use a placeholder since we don't have it in profiles
    const userEmail = `${selectedUser.full_name?.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    
    addAdminMutation.mutate({
      userId: selectedUserId,
      isSuperAdmin,
      userEmail,
      userName: selectedUser.full_name || "Unknown User"
    });
  };

  const handleRemoveAdmin = (admin: Admin) => {
    setAdminToDelete(admin);
  };

  const confirmRemoveAdmin = () => {
    if (adminToDelete) {
      removeAdminMutation.mutate(adminToDelete.id);
    }
  };

  const filteredAdmins = admins?.filter(admin =>
    admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load admins</p>
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
                Admin Management ({filteredAdmins.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage platform administrators and their permissions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Admin Type</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">
                      {admin.full_name || "No name"}
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.is_super_admin ? "default" : "secondary"}>
                        {admin.is_super_admin ? (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Super Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {admin.last_sign_in_at 
                        ? new Date(admin.last_sign_in_at).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
            <DialogDescription>
              Select a user to grant admin access to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {nonAdminUsers?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || "Unnamed User"} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="admin-type">Admin Type</Label>
              <Select value={isSuperAdmin ? "super" : "regular"} onValueChange={(value) => setIsSuperAdmin(value === "super")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Admin</SelectItem>
                  <SelectItem value="super">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddAdmin} 
              disabled={!selectedUserId || addAdminMutation.isPending}
            >
              {addAdminMutation.isPending ? "Adding..." : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation */}
      <AlertDialog open={!!adminToDelete} onOpenChange={() => setAdminToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for {adminToDelete?.full_name}? 
              They will no longer be able to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};