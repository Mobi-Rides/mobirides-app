-- MOB-204: Enforce one handover session per booking per type at the DB level.
-- The service already has an in-flight lock + existence check, but without this
-- constraint a race condition could still produce duplicates.
ALTER TABLE public.handover_sessions
  ADD CONSTRAINT handover_sessions_booking_id_handover_type_key
  UNIQUE (booking_id, handover_type);
