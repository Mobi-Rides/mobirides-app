-- Fix Security Definer Views - Set all to SECURITY INVOKER
-- This ensures views respect RLS policies of the querying user

-- 1. Fix email_analytics_summary view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'email_analytics_summary' AND schemaname = 'public') THEN
    ALTER VIEW public.email_analytics_summary SET (security_invoker = true);
  END IF;
END $$;

-- 2. Fix conversation_messages_with_replies view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'conversation_messages_with_replies' AND schemaname = 'public') THEN
    ALTER VIEW public.conversation_messages_with_replies SET (security_invoker = true);
  END IF;
END $$;

-- 3. Fix provider_performance_summary view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'provider_performance_summary' AND schemaname = 'public') THEN
    ALTER VIEW public.provider_performance_summary SET (security_invoker = true);
  END IF;
END $$;

-- 4. Fix messages_with_replies view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'messages_with_replies' AND schemaname = 'public') THEN
    ALTER VIEW public.messages_with_replies SET (security_invoker = true);
  END IF;
END $$;

-- 5. Fix audit_analytics view
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'audit_analytics' AND schemaname = 'public') THEN
    ALTER VIEW public.audit_analytics SET (security_invoker = true);
  END IF;
END $$;