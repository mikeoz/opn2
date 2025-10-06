-- Add profile_photos column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_photos jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.profile_photos IS 'Array of photo objects with url, is_primary, and uploaded_at fields. Maximum 5 photos per user.';

-- Create index for faster queries on profile_photos
CREATE INDEX IF NOT EXISTS idx_profiles_photos ON public.profiles USING gin(profile_photos);