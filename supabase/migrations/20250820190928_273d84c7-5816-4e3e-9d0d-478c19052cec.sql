-- Add customization settings to standard_card_templates
ALTER TABLE public.standard_card_templates 
ADD COLUMN allow_recipient_modifications boolean DEFAULT true,
ADD COLUMN sharing_permissions jsonb DEFAULT '{"can_customize": true, "can_share": true}'::jsonb;

-- Create card_invitation_notifications table for tracking invitation lifecycle
CREATE TABLE public.card_invitation_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id uuid NOT NULL,
  recipient_id uuid,
  creator_id uuid NOT NULL,
  notification_type text NOT NULL, -- 'delivered', 'opened', 'accepted', 'modified', 'shared_back'
  notification_data jsonb DEFAULT '{}'::jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on card_invitation_notifications
ALTER TABLE public.card_invitation_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for card_invitation_notifications
CREATE POLICY "Users can view notifications they created or received"
ON public.card_invitation_notifications
FOR SELECT
USING (auth.uid() = creator_id OR auth.uid() = recipient_id);

CREATE POLICY "System can create notifications"
ON public.card_invitation_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Recipients can mark notifications as read"
ON public.card_invitation_notifications
FOR UPDATE
USING (auth.uid() = recipient_id OR auth.uid() = creator_id);

-- Add template usage tracking to card_templates
ALTER TABLE public.card_templates
ADD COLUMN source_template_id uuid REFERENCES public.standard_card_templates(id),
ADD COLUMN customization_allowed boolean DEFAULT true,
ADD COLUMN template_watermark jsonb DEFAULT '{}'::jsonb;

-- Create template_favorites table for user favorites
CREATE TABLE public.template_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  template_id uuid NOT NULL,
  template_type text NOT NULL DEFAULT 'standard', -- 'standard' or 'user'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, template_id, template_type)
);

-- Enable RLS on template_favorites
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for template_favorites
CREATE POLICY "Users can manage their own favorites"
ON public.template_favorites
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);