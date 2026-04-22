import React from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InsuranceCoverageDialog } from "./InsuranceCoverageDialog";

interface InsurancePolicy {
  id: string;
  total_premium: number;
  payu_amount: number | null;
  mobirides_commission: number | null;
  payu_remittance_status: string;
  created_at: string;
  booking_id: string;
}

const usePendingRemittance = () => {
  return useQuery({
    queryKey: ["admin-insurance-remittance"],
    queryFn: async (): Promise<InsurancePolicy[]> => {
      const { data, error } = await supabase
        .from("insurance_policies")
        .select("*")
        .eq("payu_remittance_status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};

export const InsuranceRemittanceTable = () => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const { data: policies, isLoading, error } = usePendingRemittance();

  const totalPayUPending = policies?.reduce((sum, p) => sum + (p.payu_amount || 0), 0) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          Failed to load insurance data
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700">Pending Remittance to Pay-U</h3>
                    <p className="text-sm text-slate-500">Total amount to transfer manually</p>
                </div>
                <div className="text-3xl font-bold text-slate-900">
                    BWP {totalPayUPending.toFixed(2)}
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Pending Policies ({policies?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy ID</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Pay-U (90%)</TableHead>
                  <TableHead>Commission (10%)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies?.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-mono text-xs">
                      {policy.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>BWP {policy.total_premium}</TableCell>
                    <TableCell className="font-bold text-blue-700">
                      BWP {policy.payu_amount?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-green-700">
                      BWP {policy.mobirides_commission?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {policy.payu_remittance_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(policy.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPolicyId(policy.id)} title="View coverage">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!policies?.length && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No pending remittances found.
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
      <InsuranceCoverageDialog 
        policyId={selectedPolicyId}
        onClose={() => setSelectedPolicyId(null)}
      />
    </>
  );
};
