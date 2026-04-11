import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PayoutFormData, payoutSchema } from "./schemas";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PayoutMethodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayoutMethodForm: React.FC<PayoutMethodFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PayoutFormData>({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      payout_method: "bank_transfer"
    }
  });

  const method = form.watch("payout_method");

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data?.user;
    }
  });

  const onSubmit = async (data: PayoutFormData) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      const details = data.payout_method === 'bank_transfer' 
        ? {
            bank_name: data.bank_name,
            account_number: data.account_number,
            account_holder: data.account_holder_name,
            branch_code: data.branch_code
          }
        : {
            mobile_number: data.mobile_number
          };

      const displayName = data.payout_method === 'bank_transfer'
        ? `${data.bank_name} - ***${data.account_number?.slice(-4)}`
        : `Orange Money - ${data.mobile_number}`;

      const { error } = await supabase
        .from('payout_details')
        .insert({
          host_id: currentUser.id,
          payout_method: data.payout_method,
          details_encrypted: details, // Storing as JSON for now (RLS protected)
          display_name: displayName,
          is_default: true // Make first one default
        });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payout method saved successfully",
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save payout method",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payout Method</DialogTitle>
          <DialogDescription>
            Where should we send your earnings?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Label>Payout Type</Label>
            <RadioGroup 
              value={method} 
              onValueChange={(val) => form.setValue("payout_method", val as any)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="bank_transfer" id="bank" />
                <Label htmlFor="bank" className="cursor-pointer">Bank Transfer</Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="orange_money" id="om" />
                <Label htmlFor="om" className="cursor-pointer">Orange Money</Label>
              </div>
            </RadioGroup>
          </div>

          {method === "bank_transfer" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Bank Name</Label>
                <Input placeholder="e.g. FNB Botswana" {...form.register("bank_name")} />
              </div>
              <div className="grid gap-2">
                <Label>Account Holder Name</Label>
                <Input placeholder="e.g. John Doe" {...form.register("account_holder_name")} />
              </div>
              <div className="grid gap-2">
                <Label>Account Number</Label>
                <Input placeholder="XXXXXXXXXXX" {...form.register("account_number")} />
              </div>
              <div className="grid gap-2">
                <Label>Branch Code</Label>
                <Input placeholder="XXXXXX" {...form.register("branch_code")} />
              </div>
            </div>
          )}

          {method !== "bank_transfer" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Mobile Number</Label>
                <Input placeholder="+267 7XXXXXXX" {...form.register("mobile_number")} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Method
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
