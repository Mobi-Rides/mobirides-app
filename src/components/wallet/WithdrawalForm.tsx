import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WithdrawalFormData, withdrawalSchema } from "./schemas";
import { Loader2, Plus, Banknote } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayoutMethodForm } from './PayoutMethodForm';

interface WithdrawalFormProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => void;
}

export const WithdrawalForm: React.FC<WithdrawalFormProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
    }
  });

  const { data: payoutMethods, refetch: refetchMethods } = useQuery({
    queryKey: ["payout-methods", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase
        .from('payout_details')
        .select('*')
        .eq('host_id', currentUser.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id
  });

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 200
    }
  });

  const onSubmit = async (data: WithdrawalFormData) => {
    if (data.amount > availableBalance) {
      form.setError("amount", { message: "Insufficient balance" });
      return;
    }

    if (!data.payout_method_id) {
      form.setError("payout_method_id", { message: "Select a payout method" });
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const selectedMethod = payoutMethods?.find(m => m.id === data.payout_method_id);
      
      if (!selectedMethod) throw new Error("Invalid payout method");

      const { error } = await supabase.rpc('process_withdrawal_request', {
        p_host_id: currentUser.id,
        p_amount: data.amount,
        p_payout_method: selectedMethod.payout_method,
        p_payout_details: selectedMethod.details_encrypted
      });

      if (error) throw error;
      
      toast({
        title: "Withdrawal Requested",
        description: `Request for BWP ${data.amount} submitted successfully.`,
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to process withdrawal",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Withdraw Earnings</DialogTitle>
            <DialogDescription>
              Available Balance: <span className="font-semibold text-primary">BWP {availableBalance.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Amount (BWP)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  {...form.register("amount", { valueAsNumber: true })} 
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Payout Method</Label>
                {payoutMethods && payoutMethods.length > 0 ? (
                  <Select onValueChange={(val) => form.setValue("payout_method_id", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {payoutMethods.map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50 text-center">
                    No payout methods added yet.
                  </div>
                )}
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 border-dashed border"
                  onClick={() => setShowAddMethod(true)}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add New Method
                </Button>
                
                {form.formState.errors.payout_method_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.payout_method_id.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || availableBalance < 200}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Banknote className="mr-2 h-4 w-4" />
                Withdraw Funds
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PayoutMethodForm 
        isOpen={showAddMethod} 
        onClose={() => setShowAddMethod(false)}
        onSuccess={() => {
          refetchMethods();
        }}
      />
    </>
  );
};
