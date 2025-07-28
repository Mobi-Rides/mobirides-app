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
import { PaginatedTable } from "./PaginatedTable";
import { Search, Eye, Edit, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  role: "renter" | "host" | "admin";
  phone_number: string | null;
  created_at: string;
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
          id, full_name, role, phone_number, created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
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
  
  const { data: users, isLoading, error, refetch } = useAdminUsers();

  const filteredUsers = users?.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number?.includes(searchTerm)
  ) || [];

  const displayUsers = isPreview ? filteredUsers.slice(0, maxItems) : filteredUsers;

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
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    refetch();
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    toast.success("User updated successfully");
  };

  const renderUserRow = (user: Profile) => (
    <TableRow key={user.id}>
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
        <Badge variant={getKYCBadgeVariant("not_started")}>
          not started
        </Badge>
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
            onClick={() => handleEditUser(user)}
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
            <PaginatedTable
              data={displayUsers}
              itemsPerPage={10}
              renderItem={(user) => renderUserRow(user)}
              renderHeader={() => (
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
                  <TableBody />
                </Table>
              )}
              className="overflow-x-auto"
            />
          )}
          
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
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
        <UserEditDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </>
  );
};