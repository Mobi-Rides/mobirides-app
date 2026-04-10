
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
import { Search, ArrowUpRight, Eye } from "lucide-react";
import { PayoutDetailsDialog } from "./PayoutDetailsDialog";

interface WithdrawalRequest {
  id: string;
  host_id: string;
  amount: number;
  currency: string;
  payout_method: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

const useWithdrawalRequests = () => {
  return useQuery({
    queryKey: ["admin-withdrawal-requests"],
    queryFn: async (): Promise<WithdrawalRequest[]> => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch profiles separately
      const hostIds = [...new Set((data || []).map(r => r.host_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", hostIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(req => ({
        ...req,
        profiles: profileMap.get(req.host_id) ? {
          full_name: profileMap.get(req.host_id)!.full_name,
        } : null,
      })) as WithdrawalRequest[];
    },
  });
};

export const WithdrawalRequestsTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<string | null>(null);
  const { data: requests, isLoading, error } = useWithdrawalRequests();

  const filteredRequests = requests?.filter(req =>
    req.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed": return "default";
      case "pending": return "secondary"; // Orange/Yellow
      case "processing": return "secondary";
      case "failed": return "destructive";
      default: return "outline";
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Failed to load withdrawal requests
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
            placeholder="Search withdrawals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Withdrawal Requests ({filteredRequests.length})
          </CardTitle>
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
                  <TableHead>Host</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{req.profiles?.full_name || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">
                      {req.currency} {Number(req.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(req.status)}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {req.payout_method.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedWithdrawalId(req.id)} title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
    <PayoutDetailsDialog withdrawalId={selectedWithdrawalId} onClose={() => setSelectedWithdrawalId(null)} />
  );
};
