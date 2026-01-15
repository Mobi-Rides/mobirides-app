import React, { useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, AlertTriangle } from "lucide-react";
import { useAdminUsersComplete, type AdminUserComplete } from "@/hooks/useAdminUsersComplete";
import { UserActionsDropdown } from "./UserActionsDropdown";
import { UserEditDialog } from "./UserEditDialog";
import { UserDetailDialog } from "./UserDetailDialog";
import { getDisplayName } from "@/utils/displayName";

interface UnifiedUserTableProps {
  selectedUsers: string[];
  onUserSelect: (userId: string, selected: boolean) => void;
  onSelectAll: (userIds: string[], selected: boolean) => void;
}

export const UnifiedUserTable: React.FC<UnifiedUserTableProps> = ({
  selectedUsers,
  onUserSelect,
  onSelectAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUserComplete | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const itemsPerPage = 15;

  const { data: users, isLoading, error, refetch } = useAdminUsersComplete();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term) ||
        user.phone_number?.includes(term) ||
        user.user_roles.some((r) => r.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const allSelected = useMemo(() => {
    const ids = filteredUsers.map((u) => u.id);
    return ids.length > 0 && ids.every((id) => selectedUsers.includes(id));
  }, [filteredUsers, selectedUsers]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      const ids = filteredUsers.map((u) => u.id);
      onSelectAll(ids, checked);
    },
    [filteredUsers, onSelectAll]
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
      case "super_admin":
        return "destructive";
      case "host":
        return "default";
      case "renter":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getKYCBadgeVariant = (status: string | null) => {
    switch (status) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const handleViewDetails = (user: AdminUserComplete) => {
    setSelectedUser(user);
    setIsDetailDialogOpen(true);
  };

  const handleEditUser = (user: AdminUserComplete) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateSuccess = () => {
    refetch();
    setIsEditDialogOpen(false);
    setIsDetailDialogOpen(false);
    setSelectedUser(null);
  };

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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Profile Role</TableHead>
                    <TableHead>User Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    return (
                      <TableRow
                        key={user.id}
                        className={`hover:bg-muted/50 ${isSelected ? "bg-muted/30" : ""}`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onUserSelect(user.id, !!checked)}
                            aria-label={`Select ${getDisplayName(user)}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex flex-col cursor-pointer"
                            onClick={() => handleViewDetails(user)}
                          >
                            <span className="font-medium">{getDisplayName(user)}</span>
                            {user.email && user.full_name && (
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.user_roles.length > 0 ? (
                              user.user_roles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.is_restricted ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              Restricted
                            </Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getKYCBadgeVariant(user.verification_status)}>
                            {user.verification_status || "Not started"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            <div>{user.vehicles_count} cars</div>
                            <div>{user.bookings_count} bookings</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <UserActionsDropdown
                            user={user}
                            onViewDetails={handleViewDetails}
                            onEditUser={handleEditUser}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {paginatedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        className={
                          currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
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
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {selectedUser && (
          <>
            <UserEditDialog
              user={{
                id: selectedUser.id,
                full_name: selectedUser.full_name,
                role: selectedUser.role as "renter" | "host" | "admin" | "super_admin",
                phone_number: selectedUser.phone_number,
                created_at: selectedUser.created_at,
              }}
              isOpen={isEditDialogOpen}
              onClose={() => setIsEditDialogOpen(false)}
              onSuccess={handleUpdateSuccess}
            />
            <UserDetailDialog
              user={{
                id: selectedUser.id,
                full_name: selectedUser.full_name,
                role: selectedUser.role as "renter" | "host" | "admin" | "super_admin",
                phone_number: selectedUser.phone_number,
                created_at: selectedUser.created_at,
                avatar_url: selectedUser.avatar_url,
                email: selectedUser.email || undefined,
              }}
              isOpen={isDetailDialogOpen}
              onClose={() => setIsDetailDialogOpen(false)}
              onUserUpdate={handleUpdateSuccess}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};
