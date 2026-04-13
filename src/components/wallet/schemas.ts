import { z } from "zod";

export const payoutSchema = z.object({
  payout_method: z.enum(["bank_transfer", "orange_money", "myzaka", "smega"]),
  
  // Bank Details
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  account_holder_name: z.string().optional(),
  branch_code: z.string().optional(),
  
  // Mobile Money Details
  mobile_number: z.string().optional(),
  mobile_provider: z.string().optional(),
}).refine((data) => {
  if (data.payout_method === "bank_transfer") {
    return !!data.bank_name && !!data.account_number && !!data.account_holder_name;
  }
  return !!data.mobile_number;
}, {
  message: "Please fill in all required fields for the selected method",
  path: ["payout_method"]
});

export type PayoutFormData = z.infer<typeof payoutSchema>;

export const withdrawalSchema = z.object({
  amount: z.number().min(200, "Minimum withdrawal is BWP 200"),
  payout_method_id: z.string().min(1, "Please select a payout method"),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
