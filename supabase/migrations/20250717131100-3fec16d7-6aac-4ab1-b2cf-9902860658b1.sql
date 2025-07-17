
-- Ensure the providers table exists with correct structure
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  provider_type text NOT NULL,
  description text,
  capabilities jsonb DEFAULT '[]'::jsonb,
  standards jsonb DEFAULT '[]'::jsonb,
  contact_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
DROP POLICY IF EXISTS "System can create providers during registration" ON public.providers;
DROP POLICY IF EXISTS "System can update providers" ON public.providers;

-- Create the necessary policies
CREATE POLICY "Anyone can view providers" 
  ON public.providers 
  FOR SELECT 
  USING (true);

CREATE POLICY "System can create providers during registration" 
  ON public.providers 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update providers" 
  ON public.providers 
  FOR UPDATE 
  USING (true);

-- Ensure the handle_new_user trigger exists and is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
