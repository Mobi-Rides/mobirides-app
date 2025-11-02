-- Add 'super_admin' to user_role enum if it doesn't exist
-- This migration fixes errors where SQL or policies reference 'super_admin'
-- but the database enum does not include that value.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
