import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { VerificationData } from "@/types/verification";
import { VerificationReviewDialog } from "@/components/admin/VerificationReviewDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Database } from "@/integrations/supabase/types";

// Extended verification type for admin table with profile data
interface AdminVerificationData extends Pick<VerificationData, 
  'id' | 'user_id' | 'overall_status' | 'current_step' | 'personal_info_completed' | 
  'documents_completed' | 'selfie_completed' | 'phone_verified' | 'address_confirmed'
> {
  started_at: string | null;
  profiles?: {
    full_name: string;
    role: string;
  };
}

const useAdminVerifications = () => {
  return useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async (): Promise<AdminVerificationData[]> => {
      const { data, error } = await supabase
        .from("user_verifications")
        .select(`
          id, user_id, overall_status, current_step, personal_info_completed,
          documents_completed, selfie_completed, phone_verified, address_confirmed,
          started_at
        `)
        .order("started_at", { ascending: false });

      if (error) throw error;
      
      // Manually fetch profiles for each verification
      const verificationsWithProfiles = await Promise.all(
        (data || []).map(async (verification) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", verification.user_id)
            .single();
            
          return {
            ...verification,
            profiles: profile
          };
        })
      );
      
      return verificationsWithProfiles;
    },
  });
};

export const VerificationManagementTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVerification, setSelectedVerification] = useState<AdminVerificationData | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const { data: verifications, isLoading, error, refetch } = useAdminVerifications();

  const filteredVerifications = useMemo(() => verifications?.filter(verification =>
    verification.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.overall_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.current_step.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [], [verifications, searchTerm]);

  const { sortedData: sortedVerifications, sortKey, sortDirection, handleSort } = useTableSort<AdminVerificationData>(filteredVerifications);

  const paginatedVerifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedVerifications.slice(start, start + itemsPerPage);
  }, [sortedVerifications, currentPage]);

  const totalPages = Math.ceil(sortedVerifications.length / itemsPerPage);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      case "not_started": return "outline";
      case "requires_reverification": return "destructive";
      default: return "outline";
    }
  };

  const getCompletionPercentage = (v: AdminVerificationData) => {
    let completed = 0;
    if (v.personal_info_completed) completed++;
    if (v.documents_completed) completed++;
    if (v.overall_status === 'completed') completed++;
    return Math.round((completed / 3) * 100);
  };

  const updateVerificationStatus = async (
    verificationId: string,
    newStatus: Database["public"]["Enums"]["verification_status"]
  ) => {
    try {
      // Get the user_id for this verification so we can sync profiles
      const verification = verifications?.find(v => v.id === verificationId);

      const { error } = await supabase
        .from("user_verifications")
        .update({ 
          overall_status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", verificationId);

      if (error) throw error;

      // Belt-and-suspenders: also update profiles.verification_status directly
      if (verification?.user_id) {
        await supabase
          .from("profiles")
          .update({ verification_status: newStatus })
          .eq("id", verification.user_id);
      }
      
      refetch();
      toast.success(`Verification ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification");
    }
  };


  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load verifications</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search verifications..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verifications ({filteredVerifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12" />
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
                  <SortableTableHead sortKey="profiles.full_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>User</SortableTableHead>
                  <SortableTableHead sortKey="profiles.role" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Role</SortableTableHead>
                  <SortableTableHead sortKey="overall_status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>
                  <SortableTableHead sortKey="current_step" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Current Step</SortableTableHead>
                  <TableHead>Progress</TableHead>
                  <SortableTableHead sortKey="started_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Submitted</SortableTableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">
                      {verification.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {verification.profiles?.role || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(verification.overall_status)}>
                        {verification.overall_status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {verification.current_step.replace("_", " ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${getCompletionPercentage(verification)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getCompletionPercentage(verification)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                    {verification.started_at ? new Date(verification.started_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {verification.overall_status === "pending_review" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateVerificationStatus(verification.id, "completed")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateVerificationStatus(verification.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVerification(verification);
                            setIsReviewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing {sortedVerifications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
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
            </>
          )}
        </CardContent>
      </Card>
      <VerificationReviewDialog
        verification={selectedVerification}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
      />
    </div>
  );
};