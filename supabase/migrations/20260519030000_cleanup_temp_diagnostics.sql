-- Migration: Cleanup temporary diagnostic functions
-- Drops all functions that were created for the diagnostic phase to maintain security and hygiene.

DROP FUNCTION IF EXISTS public.admin_profile_gap_report();
DROP FUNCTION IF EXISTS public.admin_profile_metadata_status();
DROP FUNCTION IF EXISTS public.admin_missing_name_breakdown();
