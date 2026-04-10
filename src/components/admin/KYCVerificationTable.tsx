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
import { useTableSort } from "@/hooks/useTableSort";
import { SortableTableHead } from "./SortableTableHead";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { PersonalInfo } from "@/types/verification";

interface PendingVerification {
  id: string;
  user_id: string;
  overall_status: string;
  current_step: string;
  started_at: string;
  personal_info: unknown;
  profiles?: {
    full_name: string | null;
    phone_number: string | null;
  } | null;
}

const usePendingVerifications = () => {
  return useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async (): Promise<PendingVerification[]> => {
      const { data, error } = await supabase
        .from("user_verifications")
        .select(`
          id, user_id, overall_status, current_step, started_at, personal_info,
          profiles:user_id(full_name, phone_number)
        `)
        .in("overall_status", ["pending_review", "in_progress", "not_started"])
        .neq("current_step", "personal_info")
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

interface KYCVerificationTableProps {
  isPreview?: boolean;
  maxItems?: number;
}

export const KYCVerificationTable: React.FC<KYCVerificationTableProps> = ({
  isPreview = false,
  maxItems = 5
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isPreview ? maxItems : 5;
  const { data: verifications, isLoading, error, refetch } = usePendingVerifications();

  const filteredVerifications = verifications?.filter(verification =>
    verification.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.overall_status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const { sortedData: sortedVerifications, sortKey, sortDirection, handleSort } = useTableSort<PendingVerification>(filteredVerifications);

  const paginatedVerifications = sortedVerifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const displayVerifications = isPreview ? sortedVerifications.slice(0, maxItems) : paginatedVerifications;
  const totalPages = Math.ceil(sortedVerifications.length / itemsPerPage);

  const handleApproveVerification = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          overall_status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", verificationId);

      if (error) throw error;

      refetch();
      toast.success("Verification approved successfully");
    } catch (error) {
      console.error("Error approving verification:", error);
      toast.error("Failed to approve verification");
    }
  };

  const handleRejectVerification = async (verificationId: string) => {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({
          overall_status: "rejected",
          rejection_reasons: ["Manual review rejection"]
        })
        .eq("id", verificationId);

      if (error) throw error;

      refetch();
      toast.success("Verification rejected");
    } catch (error) {
      console.error("Error rejecting verification:", error);
      toast.error("Failed to reject verification");
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed": return "default";
      case "pending_review": return "secondary";
      case "in_progress": return "secondary";
      case "rejected":
      case "requires_reverification": return "destructive";
      case "not_started":
      default: return "outline";
    }
  };

  const renderVerificationRow = (verification: PendingVerification) => (
    <TableRow key={verification.id}>
      <TableCell className="font-medium">
        {verification.profiles?.full_name || "Unknown"}
      </TableCell>
      <TableCell>{verification.profiles?.phone_number || "N/A"}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(verification.overall_status)}>
          {verification.overall_status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell>{verification.current_step}</TableCell>
      <TableCell>
        {new Date(verification.started_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleApproveVerification(verification.id)}
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRejectVerification(verification.id)}
          >
            <XCircle className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load pending verifications</p>
        </CardContent>
      </Card>
    );
  }

  if (!isPreview) {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>KYC Verification Queue ({filteredVerifications.length})</CardTitle>
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search verifications..."
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>User</SortableTableHead>
                    <SortableTableHead sortKey="profiles.phone_number" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Phone</SortableTableHead>
                    <SortableTableHead sortKey="overall_status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                    <SortableTableHead sortKey="current_step" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Current Step</SortableTableHead>
                    <SortableTableHead sortKey="started_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Submitted</SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayVerifications.map((verification) => renderVerificationRow(verification))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && filteredVerifications.length > 0 && !isPreview && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, sortedVerifications.length)} of {sortedVerifications.length}{" "}
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
          )}

          {!isLoading && filteredVerifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pending KYC verifications
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

  if (displayVerifications.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No pending KYC verifications
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>User</SortableTableHead>
            <SortableTableHead sortKey="profiles.phone_number" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Phone</SortableTableHead>
            <SortableTableHead sortKey="overall_status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
            <SortableTableHead sortKey="current_step" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Current Step</SortableTableHead>
            <SortableTableHead sortKey="started_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Submitted</SortableTableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayVerifications.map((verification) => renderVerificationRow(verification))}
        </TableBody>
      </Table>
    </div>
  );
};