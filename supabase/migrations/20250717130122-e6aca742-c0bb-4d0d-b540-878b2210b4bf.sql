-- Update the providers table policies to allow system inserts during registration
DROP POLICY IF EXISTS "System can create providers" ON public.providers;

-- Create a more permissive policy for system inserts during user registration
CREATE POLICY "System can create providers during registration" 
  ON public.providers 
  FOR INSERT 
  WITH CHECK (true);

-- Also allow updates for provider management
CREATE POLICY IF NOT EXISTS "System can update providers" 
  ON public.providers 
  FOR UPDATE 
  USING (true);