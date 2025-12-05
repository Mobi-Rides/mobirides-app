
-- ============================================================================
-- BACKFILL: Create profiles for 6 legacy users (pre-Oct 29, 2025)
-- ============================================================================
-- 
-- PURPOSE:
-- Creates missing profile records for 6 real users who signed up before
-- Arnold's handle_new_user trigger fix was deployed on October 29, 2025.
-- The trigger has been working perfectly (100% success rate) since Oct 29.
--
-- CONTEXT:
-- - 30 total orphaned users identified
-- - 24 are test accounts (@example.com emails)
-- - 6 are real users that need backfilling (done here)
-- - All users created after Oct 29, 2025 have profiles automatically
--
-- CREATED: 2025-12-01
-- RELATED: docs/Product Status/DECEMBER_2025_WEEK_1_EXECUTIVE_SUMMARY.md
-- ============================================================================

-- Backfill profiles for 6 real legacy users
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
VALUES 
  -- User 1: ziljabari@gmail.com (June 30, 2025)
  ('7257e947-01f6-4015-93c7-cc61f0833e2a', 'User', 'renter', '2025-06-30 20:23:51.248317+00', NOW()),
  
  -- User 2: jewelmosinki03@gmail.com (June 30, 2025)
  ('c2c92c96-be9d-4802-bf72-1606b9461eaa', 'User', 'renter', '2025-06-30 20:53:50.343676+00', NOW()),
  
  -- User 3: mail@mauo.com (July 28, 2025)
  ('acf4716c-1095-4f26-b1a3-c2f76671bcd1', 'User', 'renter', '2025-07-28 07:03:05.721772+00', NOW()),
  
  -- User 4: mytaxibw@gmail.com (Sept 4, 2025) - has metadata full_name
  ('e5dfe1cb-baa3-4fdb-ae7c-5bd9926f1206', 'Thabang Stephano Kehemetswe', 'renter', '2025-09-04 20:17:51.272997+00', NOW()),
  
  -- User 5: teboho.mosuhli97@gmail.com (Sept 8, 2025)
  ('3d50c70c-e35d-4842-9fc5-633239787cc6', 'User', 'renter', '2025-09-08 16:32:19.911448+00', NOW()),
  
  -- User 6: maphanyane@yahoo.com (Sept 12, 2025) - has metadata full_name
  ('efd45dab-0f02-4cfd-9d6f-cd90ebec5ade', 'Motlhabane Maphanyane', 'renter', '2025-09-12 11:52:02.826328+00', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verification query (commented out for migration)
-- SELECT 
--   COUNT(*) as backfilled_profiles,
--   MIN(created_at) as earliest_user,
--   MAX(created_at) as latest_user
-- FROM profiles
-- WHERE id IN (
--   '7257e947-01f6-4015-93c7-cc61f0833e2a',
--   'c2c92c96-be9d-4802-bf72-1606b9461eaa',
--   'acf4716c-1095-4f26-b1a3-c2f76671bcd1',
--   'e5dfe1cb-baa3-4fdb-ae7c-5bd9926f1206',
--   '3d50c70c-e35d-4842-9fc5-633239787cc6',
--   'efd45dab-0f02-4cfd-9d6f-cd90ebec5ade'
-- );
