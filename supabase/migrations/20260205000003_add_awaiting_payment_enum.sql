
-- Add 'awaiting_payment' to booking_status enum
ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'awaiting_payment';
