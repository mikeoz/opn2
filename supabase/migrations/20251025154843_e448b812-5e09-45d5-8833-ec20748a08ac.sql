-- Add minor child support to organization_memberships
ALTER TABLE public.organization_memberships 
ADD COLUMN IF NOT EXISTS is_minor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS guardian_user_id uuid REFERENCES auth.users(id);

-- Add profile claim tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_claimed_from uuid;

-- Create pending_family_profiles table for seeded profiles
CREATE TABLE IF NOT EXISTS public.pending_family_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_unit_id uuid NOT NULL REFERENCES public.family_units(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text NOT NULL,
  phone text,
  relationship_label text NOT NULL,
  generation_level integer DEFAULT 1,
  member_type text NOT NULL CHECK (member_type IN ('minor', 'adult')),
  seed_data jsonb DEFAULT '{}'::jsonb,
  invitation_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired', 'declined')),
  claimed_by uuid REFERENCES auth.users(id),
  claimed_at timestamp with time zone,
  sent_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create family_ownership_transfers table
CREATE TABLE IF NOT EXISTS public.family_ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_unit_id uuid NOT NULL REFERENCES public.family_units(id) ON DELETE CASCADE,
  current_owner uuid NOT NULL REFERENCES auth.users(id),
  proposed_owner_email text NOT NULL,
  proposed_owner_id uuid REFERENCES auth.users(id),
  transfer_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message text,
  sent_at timestamp with time zone,
  responded_at timestamp with time zone,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.pending_family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_ownership_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pending_family_profiles
CREATE POLICY "Users can create seed profiles for their family units"
ON public.pending_family_profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.family_units
    WHERE id = pending_family_profiles.family_unit_id
    AND trust_anchor_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view seed profiles they created"
ON public.pending_family_profiles FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can view seed profiles by invitation token"
ON public.pending_family_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update seed profiles they created"
ON public.pending_family_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can claim seed profiles"
ON public.pending_family_profiles FOR UPDATE
TO authenticated
USING (status = 'pending' AND expires_at > now());

-- RLS Policies for family_ownership_transfers
CREATE POLICY "Family owners can initiate transfers"
ON public.family_ownership_transfers FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = current_owner AND
  EXISTS (
    SELECT 1 FROM public.family_units
    WHERE id = family_ownership_transfers.family_unit_id
    AND trust_anchor_user_id = auth.uid()
  )
);

CREATE POLICY "Current and proposed owners can view transfers"
ON public.family_ownership_transfers FOR SELECT
TO authenticated
USING (
  auth.uid() = current_owner OR 
  auth.uid() = proposed_owner_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email = family_ownership_transfers.proposed_owner_email
  )
);

CREATE POLICY "Proposed owners can respond to transfers"
ON public.family_ownership_transfers FOR UPDATE
TO authenticated
USING (
  status = 'pending' AND 
  expires_at > now() AND
  (
    auth.uid() = proposed_owner_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = family_ownership_transfers.proposed_owner_email
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_profiles_family_unit ON public.pending_family_profiles(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_pending_profiles_created_by ON public.pending_family_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_pending_profiles_token ON public.pending_family_profiles(invitation_token);
CREATE INDEX IF NOT EXISTS idx_pending_profiles_email ON public.pending_family_profiles(email);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_family_unit ON public.family_ownership_transfers(family_unit_id);
CREATE INDEX IF NOT EXISTS idx_ownership_transfers_token ON public.family_ownership_transfers(transfer_token);

-- Create trigger for updated_at
CREATE TRIGGER update_pending_profiles_updated_at
  BEFORE UPDATE ON public.pending_family_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ownership_transfers_updated_at
  BEFORE UPDATE ON public.family_ownership_transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();