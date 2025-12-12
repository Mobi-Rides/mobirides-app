import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserEditDialog } from "./UserEditDialog";
import { UserDetailDialog } from "./UserDetailDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Eye, Edit, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin" | "super_admin";
  phone_number: string | null;
  created_at: string;
  avatar_url: string | null;
  verification_status?: string | null;
  requires_reverification?: boolean;
}

interface UserManagementTableProps {
  isPreview?: boolean;
  maxItems?: number;
}

const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id, 
          full_name, 
          role, 
          phone_number, 
          created_at, 
          avatar_url
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data - verification fields will be null since we removed the join
      return (data || []).map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        phone_number: user.phone_number,
        created_at: user.created_at,
        avatar_url: user.avatar_url,
        verification_status: null,
        requires_reverification: false,
      })) as Profile[];
    },
  });
};

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ 
  isPreview = false, 
  maxItems = 5 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Debug effect to monitor state changes
  React.useEffect(() => {
    console.log("State changed - selectedUser:", selectedUser?.id, "isEditDialogOpen:", isEditDialogOpen, "isDetailDialogOpen:", isDetailDialogOpen);
  }, [selectedUser, isEditDialogOpen, isDetailDialogOpen]);
  
  const { data: users, isLoading, error, refetch } = useAdminUsers();

  const filteredUsers = users?.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.includes(searchTerm)
  ) || [];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const displayUsers = isPreview 
    ? filteredUsers.slice(0, maxItems) 
    : filteredUsers;
    
  const paginatedUsers = isPreview 
    ? displayUsers 
    : displayUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
  const totalPages = Math.ceil(displayUsers.length / itemsPerPage);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "host": return "default";
      case "renter": return "secondary";
      default: return "outline";
    }
  };

  const getKYCBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const handleEditUser = (user: Profile) => {
    console.log("handleEditUser called with:", user);
    setSelectedUser(user);
    setIsEditDialogOpen(true);
    console.log("Edit dialog state set to true");
  };

  const handleViewUser = (user: Profile) => {
    console.log("handleViewUser called with:", user);
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
    console.log("Detail dialog state set to true");
  };

  const handleUpdateSuccess = () => {
    refetch();
    setIsEditDialogOpen(false);
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
    toast.success("User updated successfully");
  };

  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
  };

  const renderUserRow = (user: Profile) => (
    <TableRow 
      key={user.id} 
      className="cursor-pointer hover:bg-muted/50" 
      onClick={() => handleViewUser(user)}
    >
      <TableCell className="font-medium">
        {user.full_name || "No name"}
      </TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="default">Active</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant={getKYCBadgeVariant(user.verification_status || "not_started")}>
            {user.verification_status || "not started"}
          </Badge>
          {user.requires_reverification && (
            <Badge variant="destructive" className="text-xs">
              Re-verify
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{user.phone_number || "N/A"}</TableCell>
      <TableCell>
        {new Date(user.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              console.log("Eye button clicked for user:", user.id);
              e.stopPropagation();
              handleViewUser(user);
            }}
            title="View User Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              console.log("Edit button clicked for user:", user.id);
              e.stopPropagation();
              handleEditUser(user);
            }}
            title="Edit User"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load users</p>
        </CardContent>
      </Card>
    );
  }

  if (!isPreview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
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
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>KYC Status</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => renderUserRow(user))}
                  </TableBody>
                </Table>
              </div>
              
              {!isPreview && totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                        const pageNum = i + 1;
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
            </>
          )}
          
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}

          {selectedUser && (
            <>
              {console.log("Rendering dialogs for user:", selectedUser.id, "Edit open:", isEditDialogOpen, "Detail open:", isDetailDialogOpen)}
              <UserEditDialog
                user={selectedUser}
                isOpen={isEditDialogOpen}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={handleUpdateSuccess}
              />
              <UserDetailDialog
                user={selectedUser}
                isOpen={isDetailDialogOpen}
                onClose={handleCloseDetailDialog}
                onUserUpdate={() => {
                  refetch();
                  handleUpdateSuccess();
                }}
              />
             </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Preview mode
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (displayUsers.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No users found
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user) => renderUserRow(user))}
          </TableBody>
        </Table>
      </div>

      {selectedUser && (
        <>
          {console.log("Rendering dialogs for user:", selectedUser.id, "Edit open:", isEditDialogOpen, "Detail open:", isDetailDialogOpen)}
          <UserEditDialog
            user={selectedUser}
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSuccess={handleUpdateSuccess}
          />
          <UserDetailDialog
            user={selectedUser}
            isOpen={isDetailDialogOpen}
            onClose={handleCloseDetailDialog}
            onUserUpdate={() => {
              refetch();
              handleUpdateSuccess();
            }}
          />
         </>
      )}
    </>
  );
};