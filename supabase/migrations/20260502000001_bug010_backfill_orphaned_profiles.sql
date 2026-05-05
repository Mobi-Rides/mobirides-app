-- BUG-010: One-shot backfill for auth.users rows that have no profile.
-- Root cause: migration 20260413193000 replaced on_auth_user_created to call
-- handle_new_user_welcome_email() only — profile creation stopped for all
-- signups after that date.
--
-- Safe to re-run: ON CONFLICT (id) DO NOTHING skips already-existing profiles.

INSERT INTO public.profiles (id, role, created_at, updated_at)
SELECT
  u.id,
  'renter'::public.user_role,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
