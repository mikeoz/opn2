-- Create relationship_cards table for bilateral relationship management
CREATE TABLE public.relationship_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_email TEXT,
  relationship_label_from TEXT NOT NULL,
  relationship_label_to TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited',
  confidence JSONB DEFAULT '{"indicator_type": "self", "verified_by": null, "timestamp": null}'::jsonb,
  network_rules TEXT,
  shared_attributes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  modified_at TIMESTAMPTZ,
  reciprocal_card_id UUID REFERENCES public.relationship_cards(id),
  CONSTRAINT valid_status CHECK (status IN ('invited', 'accepted', 'modified', 'rejected', 'terminated')),
  CONSTRAINT valid_indicator_type CHECK (
    (confidence->>'indicator_type') IN ('self', 'third_party', 'hybrid')
  ),
  CONSTRAINT requires_to_user_identifier CHECK (
    to_user_id IS NOT NULL OR to_user_email IS NOT NULL
  )
);

-- Create indexes for performance
CREATE INDEX idx_relationship_cards_from_user ON public.relationship_cards(from_user_id);
CREATE INDEX idx_relationship_cards_to_user ON public.relationship_cards(to_user_id);
CREATE INDEX idx_relationship_cards_status ON public.relationship_cards(status);
CREATE INDEX idx_relationship_cards_invitation_token ON public.relationship_cards(invitation_token);
CREATE INDEX idx_relationship_cards_to_email ON public.relationship_cards(to_user_email);

-- Enable RLS
ALTER TABLE public.relationship_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own relationship cards"
  ON public.relationship_cards
  FOR SELECT
  USING (
    auth.uid() = from_user_id 
    OR auth.uid() = to_user_id
    OR (to_user_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = relationship_cards.to_user_email
    ))
  );

CREATE POLICY "Users can create relationship invitations"
  ON public.relationship_cards
  FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their relationship cards"
  ON public.relationship_cards
  FOR UPDATE
  USING (
    auth.uid() = from_user_id 
    OR auth.uid() = to_user_id
    OR (to_user_email IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.email = relationship_cards.to_user_email
    ))
  );

CREATE POLICY "Users can delete their own relationship cards"
  ON public.relationship_cards
  FOR DELETE
  USING (auth.uid() = from_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_relationship_cards_updated_at
  BEFORE UPDATE ON public.relationship_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create reciprocal relationship card
CREATE OR REPLACE FUNCTION public.create_reciprocal_relationship_card()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reciprocal_id UUID;
BEGIN
  -- Only create reciprocal when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' AND NEW.to_user_id IS NOT NULL THEN
    -- Check if reciprocal card already exists
    IF NEW.reciprocal_card_id IS NULL THEN
      -- Create the reciprocal card
      INSERT INTO public.relationship_cards (
        from_user_id,
        to_user_id,
        relationship_label_from,
        relationship_label_to,
        status,
        confidence,
        network_rules,
        shared_attributes,
        metadata,
        accepted_at,
        reciprocal_card_id
      ) VALUES (
        NEW.to_user_id,
        NEW.from_user_id,
        NEW.relationship_label_to,
        NEW.relationship_label_from,
        'accepted',
        NEW.confidence,
        NEW.network_rules,
        NEW.shared_attributes,
        NEW.metadata,
        NEW.accepted_at,
        NEW.id
      ) RETURNING id INTO reciprocal_id;
      
      -- Update original card with reciprocal reference
      NEW.reciprocal_card_id := reciprocal_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_reciprocal_card
  BEFORE UPDATE ON public.relationship_cards
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status != 'accepted')
  EXECUTE FUNCTION public.create_reciprocal_relationship_card();

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_relationship_invitation(
  p_invitation_token TEXT,
  p_modified_label_to TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_id UUID;
  card_status TEXT;
BEGIN
  -- Get the invitation
  SELECT id, status INTO card_id, card_status
  FROM public.relationship_cards
  WHERE invitation_token = p_invitation_token
    AND (to_user_id = auth.uid() OR to_user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    AND status = 'invited'
    AND (expires_at IS NULL OR expires_at > now());
  
  IF card_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Update the card
  UPDATE public.relationship_cards
  SET 
    status = CASE WHEN p_modified_label_to IS NOT NULL THEN 'modified' ELSE 'accepted' END,
    to_user_id = auth.uid(),
    accepted_at = now(),
    relationship_label_to = COALESCE(p_modified_label_to, relationship_label_to),
    modified_at = CASE WHEN p_modified_label_to IS NOT NULL THEN now() ELSE NULL END
  WHERE id = card_id;
  
  RETURN card_id;
END;
$$;