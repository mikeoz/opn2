-- Create family unit connections table
CREATE TABLE public.family_unit_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_family_unit_id UUID NOT NULL REFERENCES public.family_units(id) ON DELETE CASCADE,
  child_family_unit_id UUID NOT NULL REFERENCES public.family_units(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'hierarchical' CHECK (connection_type IN ('hierarchical', 'sibling', 'extended')),
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  personal_message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  connection_direction TEXT NOT NULL CHECK (connection_direction IN ('invitation', 'request')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure no duplicate connections and prevent self-connections
  UNIQUE(parent_family_unit_id, child_family_unit_id),
  CHECK (parent_family_unit_id != child_family_unit_id)
);

-- Enable RLS
ALTER TABLE public.family_unit_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family unit connections
CREATE POLICY "Family trust anchors can view connections for their units"
ON public.family_unit_connections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE (fu.id = family_unit_connections.parent_family_unit_id OR fu.id = family_unit_connections.child_family_unit_id)
    AND fu.trust_anchor_user_id = auth.uid()
  )
);

CREATE POLICY "Family trust anchors can create connections"
ON public.family_unit_connections
FOR INSERT
WITH CHECK (
  auth.uid() = initiated_by AND
  (
    EXISTS (
      SELECT 1 FROM public.family_units fu 
      WHERE fu.id = family_unit_connections.parent_family_unit_id 
      AND fu.trust_anchor_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.family_units fu 
      WHERE fu.id = family_unit_connections.child_family_unit_id 
      AND fu.trust_anchor_user_id = auth.uid()
    )
  )
);

CREATE POLICY "Family trust anchors can update connections for their units"
ON public.family_unit_connections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE (fu.id = family_unit_connections.parent_family_unit_id OR fu.id = family_unit_connections.child_family_unit_id)
    AND fu.trust_anchor_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE (fu.id = family_unit_connections.parent_family_unit_id OR fu.id = family_unit_connections.child_family_unit_id)
    AND fu.trust_anchor_user_id = auth.uid()
  )
);

CREATE POLICY "Family trust anchors can delete connections for their units"
ON public.family_unit_connections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_units fu 
    WHERE (fu.id = family_unit_connections.parent_family_unit_id OR fu.id = family_unit_connections.child_family_unit_id)
    AND fu.trust_anchor_user_id = auth.uid()
  )
);

-- Policy for public access to connections by token (for invitation emails)
CREATE POLICY "Anyone can view connections by token for invitations"
ON public.family_unit_connections
FOR SELECT
USING (invitation_token IS NOT NULL);

-- Create updated_at trigger
CREATE TRIGGER update_family_unit_connections_updated_at
  BEFORE UPDATE ON public.family_unit_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_family_unit_connections_parent ON public.family_unit_connections(parent_family_unit_id);
CREATE INDEX idx_family_unit_connections_child ON public.family_unit_connections(child_family_unit_id);
CREATE INDEX idx_family_unit_connections_token ON public.family_unit_connections(invitation_token);
CREATE INDEX idx_family_unit_connections_status ON public.family_unit_connections(status);