import React, { useState, useMemo } from "react";
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
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHead } from "./SortableTableHead";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Plus, Trash2, Shield, ShieldCheck, MoreHorizontal, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

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
        .select("id, email, full_name, is_super_admin, created_at, last_sign_in_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Admin[];
    },
  });
};

const useNonAdminUsers = () => {
  return useQuery({
    queryKey: ["non-admin-users"],
    queryFn: async (): Promise<Profile[]> => {
      // First get existing admin IDs to exclude
      const { data: existingAdmins } = await supabase
        .from("admins")
        .select("id");
      
      const adminIds = existingAdmins?.map(admin => admin.id) || [];
      
      // Get profiles that are not already admins
      let query = supabase
        .from("profiles")
        .select("id, full_name, role");
        
      if (adminIds.length > 0) {
        query = query.not("id", "in", `(${adminIds.join(",")})`);
      }

      const { data, error } = await query.order("full_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const AdminManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  
  const itemsPerPage = 8;

  const queryClient = useQueryClient();
  const { data: admins, isLoading, error } = useAdmins();
  const { data: nonAdminUsers } = useNonAdminUsers();
  const { isSuperAdmin: currentUserIsSuperAdmin } = useIsAdmin();

  const filteredAdmins = useMemo(() => {
    return admins?.filter(admin =>
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [admins, searchTerm]);

  const { sortedData: sortedAdmins, sortKey, sortDirection, handleSort } = useTableSort<Admin>(filteredAdmins);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAdmins.slice(start, start + itemsPerPage);
  }, [sortedAdmins, currentPage]);

  const totalPages = Math.ceil(sortedAdmins.length / itemsPerPage);

  const addAdminMutation = useMutation({
    mutationFn: async ({ userId, isSuperAdmin, userName }: { 
      userId: string; 
      isSuperAdmin: boolean; 
      userName: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('add-admin', {
        body: { userId, isSuperAdmin, userName }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
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

  const updateAdminRoleMutation = useMutation({
    mutationFn: async ({ adminId, isSuperAdmin }: { adminId: string; isSuperAdmin: boolean }) => {
      const { error } = await supabase.rpc('update_admin_role', {
        target_user_id: adminId,
        new_is_super_admin: isSuperAdmin
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admins"] });
      queryClient.invalidateQueries({ queryKey: ["non-admin-users"] });
      toast.success("Admin role updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update admin role: ${error.message}`);
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase.rpc('remove_admin_complete', {
        target_user_id: adminId
      });

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
    
    addAdminMutation.mutate({
      userId: selectedUserId,
      isSuperAdmin,
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
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
            <>
              <Table>
                <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Name</SortableTableHead>
                  <SortableTableHead sortKey="email" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Email</SortableTableHead>
                  <SortableTableHead sortKey="is_super_admin" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Admin Type</SortableTableHead>
                  <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Added</SortableTableHead>
                  <SortableTableHead sortKey="last_sign_in_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Last Sign In</SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAdmins.map((admin) => (
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {currentUserIsSuperAdmin && (
                            <DropdownMenuItem 
                              onClick={() => updateAdminRoleMutation.mutate({ 
                                adminId: admin.id, 
                                isSuperAdmin: !admin.is_super_admin 
                              })}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              {admin.is_super_admin ? "Demote to Admin" : "Promote to Super Admin"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleRemoveAdmin(admin)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {sortedAdmins.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
                {Math.min(currentPage * itemsPerPage, sortedAdmins.length)} of {sortedAdmins.length}{" "}
                entries
              </div>
              {totalPages > 1 && (
                <div className="order-1 sm:order-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
            </>
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
