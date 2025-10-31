-- Fix foreign key relationship for family_invitations.invited_by
-- Change from auth.users to profiles table

-- Drop the existing foreign key constraint
ALTER TABLE public.family_invitations
DROP CONSTRAINT IF EXISTS family_invitations_invited_by_fkey;

-- Add new foreign key constraint to profiles table
ALTER TABLE public.family_invitations
ADD CONSTRAINT family_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;