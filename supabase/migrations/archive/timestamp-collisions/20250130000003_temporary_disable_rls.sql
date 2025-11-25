-- Temporarily disable RLS to check data and identify the root cause
-- This is a diagnostic migration that will be reverted after investigation

-- Disable RLS on all messaging tables
ALTER TABLE "public"."conversations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_participants" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."conversation_messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users for diagnostic purposes
GRANT ALL ON "public"."conversations" TO authenticated;
GRANT ALL ON "public"."conversation_participants" TO authenticated;
GRANT ALL ON "public"."conversation_messages" TO authenticated;
GRANT ALL ON "public"."messages" TO authenticated;

GRANT SELECT ON "public"."conversations" TO anon;
GRANT SELECT ON "public"."conversation_participants" TO anon;
GRANT SELECT ON "public"."conversation_messages" TO anon;
GRANT SELECT ON "public"."messages" TO anon;