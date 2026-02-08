import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookingWithRelations } from "@/types/booking";
import { Database } from "@/integrations/supabase/types";

// Create a local type extension for the remittance table
// This overrides the generated type until the backend types are regenerated
type PremiumRemittanceBatchRow = {
  id: string;
  batch_date: string;
  total_policies: number;
  total_premium_collected: number;
  mobirides_commission_total: number;
  payu_amount_total: number;
  status: 'pending' | 'completed';
  remitted_by?: string;
  created_at: string;
};

type ExtendedDatabase = {
  public: {
    Tables: Database['public']['Tables'] & {
      premium_remittance_batches: {
        Row: PremiumRemittanceBatchRow;
        Insert: Partial<PremiumRemittanceBatchRow>;
        Update: Partial<PremiumRemittanceBatchRow>;
      };
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
};

// Extend Booking type to include insurance fields
interface PendingRemittance extends BookingWithRelations {
  insurance_premium: number;
  insurance_remitted_at?: string | null;
}

interface RemittanceBatch {
  id: string;
  batch_date: string;
  total_policies: number;
  total_premium_collected: number;
  mobirides_commission_total: number;
  payu_amount_total: number;
  status: 'pending' | 'completed';
  remitted_by?: string;
  created_at?: string;
}

export const AdminRemittanceDashboard = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use the extended database type for the client
  const supabaseClient = supabase as unknown as import('@supabase/supabase-js').SupabaseClient<ExtendedDatabase>;

  // Fetch pending policies
  const { data: pendingPolicies, isLoading: isLoadingPending, refetch } = useQuery({
    queryKey: ['pending-remittances'],
    queryFn: async () => {
      // In real implementation, join with insurance_policies table
      // For now, mocking query on bookings with insurance_premium > 0
      const { data, error } = await supabaseClient
        .from('bookings')
        .select('*, cars(brand, model)')
        .eq('status', 'completed')
        .gt('insurance_premium', 0)
        // .is('insurance_remitted_at', null) // Assuming this field exists or similar logic
        .limit(20);
      
      if (error) throw error;
      
      // Cast to correct type since we know the shape but TS doesn't
      return data as unknown as PendingRemittance[]; 
    }
  });

  // Fetch remittance batches
  const { data: batches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['remittance-batches'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('premium_remittance_batches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as RemittanceBatch[];
    }
  });

  const handleCreateBatch = async () => {
    setIsProcessing(true);
    try {
      // 1. Calculate totals
      const totalPremium = pendingPolicies?.reduce((sum, p) => sum + (p.insurance_premium || 0), 0) || 0;
      const count = pendingPolicies?.length || 0;
      const payuAmount = totalPremium * 0.90;
      const commission = totalPremium * 0.10;

      if (count === 0) {
        toast({ title: "No pending policies", description: "Nothing to remit." });
        return;
      }

      // 2. Create Batch Record
      const insertData = {
          batch_date: new Date().toISOString().split('T')[0],
          total_policies: count,
          total_premium_collected: totalPremium,
          mobirides_commission_total: commission,
          payu_amount_total: payuAmount,
          status: 'pending',
          remitted_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data: batch, error: batchError } = await supabase
        .from('premium_remittance_batches')
        .insert(insertData)
        .select()
        .single();

      if (batchError) throw batchError;

      // 3. Update Policies (Mock update for now)
      // await supabase.from('insurance_policies').update({ remittance_batch_id: batch.id }).in('id', ids)

      const batchData = batch as unknown as RemittanceBatch;

      toast({
        title: "Batch Created",
        description: `Remittance batch #${batchData.id.slice(0,8)} created for BWP ${payuAmount.toFixed(2)}`,
      });
      
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Insurance Remittance</h2>
        <Button onClick={handleCreateBatch} disabled={isProcessing || !pendingPolicies?.length}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <FileText className="mr-2 h-4 w-4" />
          Create Remittance Batch
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Remittance</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              BWP {pendingPolicies?.reduce((sum, p) => sum + ((p.insurance_premium || 0) * 0.9), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPolicies?.length || 0} policies waiting
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Remitted (YTD)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              BWP {batches?.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.payu_amount_total, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              BWP {batches?.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.mobirides_commission_total, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Remittance Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Policies</TableHead>
                <TableHead>Total Premium</TableHead>
                <TableHead>Pay-U Amount (90%)</TableHead>
                <TableHead>Commission (10%)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingBatches ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : batches?.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono">{batch.id.slice(0, 8)}...</TableCell>
                  <TableCell>{format(new Date(batch.batch_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{batch.total_policies}</TableCell>
                  <TableCell>P{batch.total_premium_collected.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">P{batch.payu_amount_total.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600">P{batch.mobirides_commission_total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === 'completed' ? 'default' : 'secondary'}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {batch.status === 'pending' && (
                      <Button size="sm" variant="outline">Mark Sent</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
