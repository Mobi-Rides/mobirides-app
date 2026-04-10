-- S10-008 / MOB-706: Fix mutable search_path on public functions
-- Adds SET search_path = public to prevent search_path injection attacks.
-- Metadata-only change; no signature or behavior changes.

ALTER FUNCTION public.advance_handover_step(uuid, text, uuid, text, jsonb) SET search_path = public;
ALTER FUNCTION public.calculate_handover_progress(uuid) SET search_path = public;
ALTER FUNCTION public.expire_insurance_policies() SET search_path = public;
ALTER FUNCTION public.generate_claim_number() SET search_path = public;
ALTER FUNCTION public.generate_policy_number() SET search_path = public;
ALTER FUNCTION public.handle_new_message_notification() SET search_path = public;
ALTER FUNCTION public.increment_car_view_count(uuid) SET search_path = public;
ALTER FUNCTION public.increment_promo_code_uses(uuid) SET search_path = public;
ALTER FUNCTION public.is_conversation_participant(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.is_conversation_participant(uuid) SET search_path = public;
ALTER FUNCTION public.update_insurance_updated_at() SET search_path = public;
ALTER FUNCTION public.verify_audit_chain_integrity() SET search_path = public;
