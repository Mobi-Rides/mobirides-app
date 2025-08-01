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
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { VerificationData } from "@/types/verification";

// Extended verification type for admin table with profile data
interface AdminVerificationData extends Pick<VerificationData, 
  'id' | 'user_id' | 'overall_status' | 'current_step' | 'personal_info_completed' | 
  'documents_completed' | 'selfie_completed' | 'phone_verified' | 'address_confirmed' | 'created_at'
> {
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
          created_at
        `)
        .order("created_at", { ascending: false });

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
  
  const { data: verifications, isLoading, error, refetch } = useAdminVerifications();

  const filteredVerifications = verifications?.filter(verification =>
    verification.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.overall_status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.current_step.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      case "not_started": return "outline";
      default: return "outline";
    }
  };

  const updateVerificationStatus = async (verificationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("user_verifications")
        .update({ 
          overall_status: newStatus,
          completed_at: newStatus === "verified" ? new Date().toISOString() : null
        })
        .eq("id", verificationId);

      if (error) throw error;
      
      refetch();
      toast.success(`Verification ${newStatus} successfully`);
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification");
    }
  };

  const getCompletionPercentage = (verification: AdminVerificationData) => {
    const steps = [
      verification.personal_info_completed,
      verification.documents_completed,
      verification.selfie_completed,
      verification.phone_verified,
      verification.address_confirmed
    ];
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
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
            onChange={(e) => setSearchTerm(e.target.value)}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Step</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
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
                      {new Date(verification.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {verification.overall_status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateVerificationStatus(verification.id, "verified")}
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
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};