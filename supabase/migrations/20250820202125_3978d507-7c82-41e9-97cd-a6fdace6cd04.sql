-- Phase 1: Database Foundation for Family Relationship Management

-- Add family-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN birth_name TEXT,
ADD COLUMN display_preferences JSONB DEFAULT '{"show_birth_name": false, "name_format": "current"}'::jsonb;

-- Add family context to organization_memberships
ALTER TABLE public.organization_memberships
ADD COLUMN family_generation INTEGER DEFAULT 1,
ADD COLUMN relationship_label TEXT,  -- e.g., "Father", "Mother", "Son", "Daughter", "Husband", "Wife"
ADD COLUMN is_family_unit BOOLEAN DEFAULT false;

-- Create family_units table for managing family hierarchies
CREATE TABLE public.family_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_label TEXT NOT NULL,  -- e.g., "Gerald Rosenlund", "Jeff Rosenlund"
  trust_anchor_user_id UUID NOT NULL,  -- Primary family member
  parent_family_unit_id UUID REFERENCES public.family_units(id),
  generation_level INTEGER NOT NULL DEFAULT 1,
  family_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on family_units
ALTER TABLE public.family_units ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_units
CREATE POLICY "Family members can view their family units"
ON public.family_units FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_memberships om
    WHERE om.organization_user_id = trust_anchor_user_id
    AND om.individual_user_id = auth.uid()
    AND om.is_family_unit = true
  )
  OR trust_anchor_user_id = auth.uid()
);

CREATE POLICY "Trust anchors can manage their family units"
ON public.family_units FOR ALL
USING (trust_anchor_user_id = auth.uid())
WITH CHECK (trust_anchor_user_id = auth.uid());

-- Create family_card_templates table for family-specific templates
CREATE TABLE public.family_card_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  relationship_context TEXT NOT NULL,  -- e.g., "parent_to_child", "spouse", "sibling"
  generation_applicable TEXT[] DEFAULT ARRAY['all'],  -- Which generations can use this
  template_fields JSONB NOT NULL,
  display_config JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on family_card_templates
ALTER TABLE public.family_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_card_templates
CREATE POLICY "Anyone can view active family templates"
ON public.family_card_templates FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage family templates"
ON public.family_card_templates FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add family context to card_relationships
ALTER TABLE public.card_relationships
ADD COLUMN family_unit_id UUID REFERENCES public.family_units(id),
ADD COLUMN relationship_context TEXT;  -- e.g., "parent_card", "child_card", "spouse_card"

-- Create index for better performance
CREATE INDEX idx_family_units_trust_anchor ON public.family_units(trust_anchor_user_id);
CREATE INDEX idx_family_units_parent ON public.family_units(parent_family_unit_id);
CREATE INDEX idx_organization_memberships_family ON public.organization_memberships(is_family_unit, family_generation);
CREATE INDEX idx_card_relationships_family ON public.card_relationships(family_unit_id);

-- Insert some default family card templates
INSERT INTO public.family_card_templates (template_name, relationship_context, template_fields, display_config) VALUES
('Parent Information Card', 'parent_to_child', 
 '[
   {"name": "Full Name", "type": "text", "required": true},
   {"name": "Birth Name", "type": "text", "required": false},
   {"name": "Role in Family", "type": "text", "required": true},
   {"name": "Generation", "type": "number", "required": true},
   {"name": "Contact Information", "type": "text", "required": false},
   {"name": "Important Dates", "type": "text", "required": false}
 ]'::jsonb, 
 '{"show_generation": true, "highlight_role": true}'::jsonb),

('Family Member Card', 'general_family', 
 '[
   {"name": "Display Name", "type": "text", "required": true},
   {"name": "Birth Name", "type": "text", "required": false},
   {"name": "Family Relationships", "type": "text", "required": false},
   {"name": "Current Location", "type": "text", "required": false},
   {"name": "Occupation", "type": "text", "required": false}
 ]'::jsonb, 
 '{"show_relationships": true, "show_generation_context": true}'::jsonb),

('Spouse Information Card', 'spouse', 
 '[
   {"name": "Full Name", "type": "text", "required": true},
   {"name": "Maiden Name", "type": "text", "required": false},
   {"name": "Marriage Date", "type": "date", "required": false},
   {"name": "Spouse Role", "type": "text", "required": true},
   {"name": "Contact Information", "type": "text", "required": false}
 ]'::jsonb, 
 '{"emphasize_marriage_info": true, "show_name_history": true}'::jsonb);

-- Create function to automatically set family generation
CREATE OR REPLACE FUNCTION public.set_family_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- If parent family unit exists, increment generation
  IF NEW.parent_family_unit_id IS NOT NULL THEN
    SELECT generation_level + 1 INTO NEW.generation_level
    FROM public.family_units
    WHERE id = NEW.parent_family_unit_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic generation setting
CREATE TRIGGER set_family_generation_trigger
  BEFORE INSERT OR UPDATE ON public.family_units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_generation();