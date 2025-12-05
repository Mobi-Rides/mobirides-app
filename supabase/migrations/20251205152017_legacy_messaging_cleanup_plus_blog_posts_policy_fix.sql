-- Phase 6: Legacy Messaging Cleanup + Blog Posts Policy Fix
-- Resolves 3 security linter ERRORs

-- ============================================
-- PHASE 1: Legacy Messaging Cleanup
-- ============================================

-- Create archive schema if not exists
CREATE SCHEMA IF NOT EXISTS archive;

-- Drop legacy view (was set to SECURITY INVOKER in previous migration)
DROP VIEW IF EXISTS public.messages_with_replies;

-- Drop message_operations table (empty, RLS disabled - ERROR #1)
DROP TABLE IF EXISTS public.message_operations CASCADE;

-- Drop empty backup tables
DROP TABLE IF EXISTS public.notifications_backup2 CASCADE;

-- Archive legacy tables to remove from public schema (ERROR #2)
-- messages table
ALTER TABLE IF EXISTS public.messages SET SCHEMA archive;

-- messages_backup table
ALTER TABLE IF EXISTS public.messages_backup_20250930_093926 SET SCHEMA archive;

-- notifications_backup table
ALTER TABLE IF EXISTS public.notifications_backup SET SCHEMA archive;

-- ============================================
-- PHASE 2: Fix Blog Posts Admin Policy (ERROR #3)
-- ============================================

-- Drop the insecure policy that references user_metadata
DROP POLICY IF EXISTS "blog_posts_admin_all" ON public.blog_posts;

-- Drop existing admin policy if it exists (to recreate with consistent naming)
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON public.blog_posts;

-- Create secure admin policy using is_admin() function
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));