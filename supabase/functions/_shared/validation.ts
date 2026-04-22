// Shared validation utilities for Edge Functions
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const EmailRequestSchema = z.object({
  to: z.string().email(),
  subject: z.string().optional(),
  html: z.string().optional(),
  templateId: z.string().optional(),
  dynamicData: z.record(z.any()).optional(),
  type: z.string().optional(),
  user_name: z.string().optional(),
});

export const WhatsAppRequestSchema = z.object({
  to: z.string().min(8),
  templateSid: z.string(),
  variables: z.record(z.any()).optional(),
});

export type EmailRequest = z.infer<typeof EmailRequestSchema>;
export type WhatsAppRequest = z.infer<typeof WhatsAppRequestSchema>;
