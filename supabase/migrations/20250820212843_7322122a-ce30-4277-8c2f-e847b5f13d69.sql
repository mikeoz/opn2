-- Add foreign key constraints to family_units table
ALTER TABLE public.family_units 
ADD CONSTRAINT fk_family_units_trust_anchor 
FOREIGN KEY (trust_anchor_user_id) 
REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.family_units 
ADD CONSTRAINT fk_family_units_parent 
FOREIGN KEY (parent_family_unit_id) 
REFERENCES public.family_units(id) ON DELETE SET NULL;

-- Enable RLS for family_units
ALTER TABLE public.family_units ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for family_units
CREATE POLICY "Users can view family units they are trust anchor of or members of" 
ON public.family_units 
FOR SELECT 
USING (
  trust_anchor_user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.organization_memberships om 
    WHERE om.organization_user_id = trust_anchor_user_id 
    AND om.individual_user_id = auth.uid() 
    AND om.is_family_unit = true 
    AND om.status = 'active'
  )
);

CREATE POLICY "Users can create family units as trust anchor" 
ON public.family_units 
FOR INSERT 
WITH CHECK (trust_anchor_user_id = auth.uid());

CREATE POLICY "Trust anchors can update their family units" 
ON public.family_units 
FOR UPDATE 
USING (trust_anchor_user_id = auth.uid());

CREATE POLICY "Trust anchors can delete their family units" 
ON public.family_units 
FOR DELETE 
USING (trust_anchor_user_id = auth.uid());