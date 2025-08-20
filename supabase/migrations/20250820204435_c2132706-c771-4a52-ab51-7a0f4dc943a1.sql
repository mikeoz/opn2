-- Add family context columns to user_cards table
ALTER TABLE public.user_cards 
ADD COLUMN family_unit_id uuid REFERENCES public.family_units(id),
ADD COLUMN family_role text,
ADD COLUMN generation_level integer DEFAULT 1;

-- Create index for better performance on family queries
CREATE INDEX idx_user_cards_family_unit ON public.user_cards(family_unit_id);
CREATE INDEX idx_user_cards_family_role ON public.user_cards(family_role);

-- Update RLS policies to include family context
DROP POLICY IF EXISTS "Users can view their own cards" ON public.user_cards;
CREATE POLICY "Users can view their own cards and family cards" 
ON public.user_cards 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (family_unit_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organization_memberships om
    JOIN public.family_units fu ON fu.trust_anchor_user_id = om.organization_user_id
    WHERE fu.id = user_cards.family_unit_id 
    AND om.individual_user_id = auth.uid()
    AND om.is_family_unit = true
    AND om.status = 'active'
  ))
);