-- Security Audit Remediations: Enforce SET search_path = public on SECURITY DEFINER functions
-- Reference: docs/plans/rls-security-architecture-overhaul-2025-10-30.md
-- Priority: P1 - High (Security)

-- 1. Standard Admin/User Management functions
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.handle_new_user(uuid) SET search_path = public;

-- 2. Business Logic functions
ALTER FUNCTION public.advance_handover_step(uuid, text, uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.calculate_handover_progress(uuid) SET search_path = public;
ALTER FUNCTION public.increment_car_view_count(uuid) SET search_path = public;
ALTER FUNCTION public.increment_promo_code_uses(uuid) SET search_path = public;
ALTER FUNCTION public.expire_insurance_policies() SET search_path = public;

-- 3. Messaging functions
ALTER FUNCTION public.handle_new_message_notification() SET search_path = public;
ALTER FUNCTION public.is_conversation_participant(uuid) SET search_path = public;
