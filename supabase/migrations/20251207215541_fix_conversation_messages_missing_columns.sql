-- Fix missing columns and enums for conversation_messages
-- This migration adds schema components that are referenced by later views but missing from base schema

-- Create message_delivery_status enum
DO $$ BEGIN
    CREATE TYPE public.message_delivery_status AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to conversation_messages
ALTER TABLE public.conversation_messages 
ADD COLUMN IF NOT EXISTS delivery_status public.message_delivery_status DEFAULT 'sent'::public.message_delivery_status,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_id UUID,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;
