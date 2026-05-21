-- Migration: Fix infinite recursion in profiles UPDATE RLS policy
-- 
-- Root cause: "Users can update their own profile" had a WITH CHECK clause that
-- contained a subquery: SELECT role FROM profiles WHERE id = auth.uid()
-- This triggers RLS evaluation on profiles again from within a profiles policy → infinite recursion.
--
-- Fix: Replace the WITH CHECK with a simple auth.uid() = id check.
-- Role-change enforcement for regular users is handled separately; super admins
-- are permitted to change roles via the "Super admins can update all profiles" policy.

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
