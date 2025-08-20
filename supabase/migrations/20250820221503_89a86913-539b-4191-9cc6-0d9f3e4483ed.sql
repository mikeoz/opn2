-- Create family invitations table
CREATE TABLE public.family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_unit_id UUID NOT NULL REFERENCES public.family_units(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  relationship_role TEXT NOT NULL,
  personal_message TEXT,
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(family_unit_id, invitee_email)
);

-- Enable RLS
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family invitations
CREATE POLICY "Family trust anchors can manage invitations for their family units"
ON public.family_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE fu.id = family_invitations.family_unit_id 
    AND fu.trust_anchor_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE fu.id = family_invitations.family_unit_id 
    AND fu.trust_anchor_user_id = auth.uid()
  )
);

-- Policy for public access to invitations (for signup flow)
CREATE POLICY "Anyone can view invitations by token for signup"
ON public.family_invitations
FOR SELECT
USING (invitation_token IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_family_invitations_token ON public.family_invitations(invitation_token);
CREATE INDEX idx_family_invitations_email ON public.family_invitations(invitee_email);
CREATE INDEX idx_family_invitations_family_unit ON public.family_invitations(family_unit_id);