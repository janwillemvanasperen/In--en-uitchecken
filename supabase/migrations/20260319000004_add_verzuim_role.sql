-- ============================================================
-- Add 'verzuim' as a valid user role
-- ============================================================

-- Drop existing check constraint on role column (if any)
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

-- Add updated constraint that includes 'verzuim'
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('student', 'admin', 'coach', 'verzuim'));
