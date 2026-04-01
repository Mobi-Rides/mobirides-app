-- Drop legacy function overloads that conflict with remote_schema.sql (20260319212624).
-- These are superseded versions with no active callers.

-- 1. Legacy 4-arg void create_handover_notification (origin: 20250130000021)
DROP FUNCTION IF EXISTS public.create_handover_notification(uuid, uuid, text, text);

-- 2. 8-arg UUID-returning create_handover_notification (origin: 20250130000025)
--    Conflicts when remote_schema tries to CREATE OR REPLACE as RETURNS bigint
DROP FUNCTION IF EXISTS public.create_handover_notification(uuid, text, text, text, text, text, text, integer);
DROP FUNCTION IF EXISTS create_handover_notification(uuid, text, text, text, text, text, text, integer);

-- 3. No-arg is_admin() overload — conflicts with is_admin(uuid DEFAULT auth.uid())
--    making calls to is_admin() ambiguous (SQLSTATE 42725)
DROP FUNCTION IF EXISTS public.is_admin();
