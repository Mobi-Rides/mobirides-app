-- This migration originally tried to add RLS to a 'locations' table that doesn't exist.
-- The correct table is 'real_time_locations' which already has RLS configured
-- in migration 20231028173000_add_location_sharing_fields.sql
-- Converting to no-op.

SELECT 1; -- No-op migration
