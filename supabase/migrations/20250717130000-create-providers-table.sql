
-- Create the providers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  description TEXT,
  capabilities JSONB DEFAULT '[]'::jsonb,
  standards JSONB DEFAULT '[]'::jsonb,
  contact_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on providers table
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to view providers
CREATE POLICY IF NOT EXISTS "Anyone can view providers" 
  ON public.providers 
  FOR SELECT 
  USING (true);

-- Only allow system/admin to insert providers (for registration process)
CREATE POLICY IF NOT EXISTS "System can create providers" 
  ON public.providers 
  FOR INSERT 
  WITH CHECK (true);
