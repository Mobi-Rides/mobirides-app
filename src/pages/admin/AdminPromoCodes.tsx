import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Tag, CalendarIcon, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PromoCode } from "@/services/promoCodeService";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ResendEmailService } from "@/services/notificationService";

export default function AdminPromoCodes() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [promoToSend, setPromoToSend] = useState<PromoCode | null>(null);
  const queryClient = useQueryClient();

  // Fetch Promo Codes
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as PromoCode[];
    },
  });

  // Create Promo Code Mutation
  const createMutation = useMutation({
    mutationFn: async (newPromo: Partial<PromoCode>) => {
      const { data, error } = await supabase
        .from("promo_codes")
        .insert([newPromo])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      setIsCreateOpen(false);
      toast.success("Promo code created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create promo code: ${error.message}`);
    },
  });

  // Delete/Deactivate Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code status updated");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Send Notification Mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (promo: PromoCode) => {
      // 1. Get users with marketing notifications enabled
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, marketing_notifications") // Assuming this column exists or we join preferences
        .eq("marketing_notifications", true)
        .not("email", "is", null);

      if (error) throw error;
      if (!users || users.length === 0) throw new Error("No users found with marketing notifications enabled");

      // 2. Send emails in batches
      const emailService = ResendEmailService.getInstance();
      let sentCount = 0;
      let failCount = 0;

      for (const user of users) {
        if (!user.email) continue;

        const result = await emailService.sendPromoNotification(
          {
            id: user.id,
            email: user.email,
            name: user.full_name || "Valued User",
            emailEnabled: true
          },
          {
            code: promo.code,
            discount: promo.discount_type === 'percentage' ? `${promo.discount_amount}% OFF` : `P${promo.discount_amount} OFF`,
            description: promo.description || "A special offer just for you!",
            validUntil: promo.valid_until ? format(new Date(promo.valid_until), "PPP") : undefined
          }
        );

        if (result.success) sentCount++;
        else failCount++;
      }

      return { sentCount, failCount };
    },
    onSuccess: (data) => {
      setPromoToSend(null);
      toast.success(`Campaign sent! Success: ${data.sentCount}, Failed: ${data.failCount}`);
    },
    onError: (error) => {
      toast.error(`Failed to send notifications: ${error.message}`);
    }
  });

  return (
    <AdminLayout title="Promo Codes">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Promotions</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
            </DialogHeader>
            <CreatePromoForm onSubmit={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : promoCodes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No promo codes found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              promoCodes?.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      {promo.code}
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {promo.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {promo.discount_type === "percentage"
                      ? `${promo.discount_amount}%`
                      : `P${promo.discount_amount}`}
                  </TableCell>
                  <TableCell>
                    {promo.current_uses} / {promo.max_uses || "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {promo.valid_until
                      ? format(new Date(promo.valid_until), "MMM d, yyyy")
                      : "No expiry"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPromoToSend(promo)}
                        disabled={!promo.is_active}
                        title="Send to users"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={promo.is_active ? "destructive" : "outline"}
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: promo.id,
                            isActive: !promo.is_active,
                          })
                        }
                      >
                        {promo.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Send Notification Confirmation Dialog */}
      <Dialog open={!!promoToSend} onOpenChange={(open) => !open && setPromoToSend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Promotional Email</DialogTitle>
            <DialogDescription>
              This will send an email notification to all users who have opted in to marketing messages.
            </DialogDescription>
          </DialogHeader>
          
          {promoToSend && (
            <div className="py-4 space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">Subject: Special Offer: {promoToSend.discount_type === 'percentage' ? `${promoToSend.discount_amount}% OFF` : `P${promoToSend.discount_amount} OFF`} with code {promoToSend.code}</p>
                <p className="text-sm text-muted-foreground mt-2">To: All users with marketing notifications enabled</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPromoToSend(null)}>Cancel</Button>
                <Button 
                  onClick={() => sendNotificationMutation.mutate(promoToSend)}
                  disabled={sendNotificationMutation.isPending}
                >
                  {sendNotificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Campaign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function CreatePromoForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: Partial<PromoCode>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    code: "",
    discount_amount: "",
    discount_type: "fixed" as "fixed" | "percentage",
    max_uses: "",
    min_booking_amount: "",
    description: "",
    valid_until: undefined as Date | undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code: formData.code.toUpperCase(),
      discount_amount: Number(formData.discount_amount),
      discount_type: formData.discount_type,
      max_uses: formData.max_uses ? Number(formData.max_uses) : null,
      min_booking_amount: formData.min_booking_amount
        ? Number(formData.min_booking_amount)
        : null,
      description: formData.description,
      valid_until: formData.valid_until ? formData.valid_until.toISOString() : null,
      is_active: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Promo Code</Label>
          <Input
            id="code"
            placeholder="e.g. SUMMER2025"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Discount Type</Label>
          <Select
            value={formData.discount_type}
            onValueChange={(val: "fixed" | "percentage") =>
              setFormData({ ...formData, discount_type: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Amount (P)</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Discount Value</Label>
          <Input
            id="amount"
            type="number"
            placeholder="e.g. 100 or 10"
            value={formData.discount_amount}
            onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_uses">Max Uses (Optional)</Label>
          <Input
            id="max_uses"
            type="number"
            placeholder="e.g. 500"
            value={formData.max_uses}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valid_until">Expiration Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !formData.valid_until && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formData.valid_until ? (
                format(formData.valid_until, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={formData.valid_until}
              onSelect={(date) => setFormData({ ...formData, valid_until: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Internal note or user-facing description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Promo Code"}
      </Button>
    </form>
  );
}
