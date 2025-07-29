-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create storage policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add avatar_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;

-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username TEXT;

-- Create index for username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Update the handle_new_user function to include username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles table with unified field structure
  INSERT INTO public.profiles (
    id,
    account_type,
    guid,
    first_name,
    last_name,
    email,
    organization_name,
    username
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual')::public.account_type,
    public.generate_guid(),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'organization_name',
    -- Generate username from email prefix
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );

  -- Only create provider for non-individual accounts
  IF COALESCE(NEW.raw_user_meta_data ->> 'account_type', 'individual') = 'non_individual' THEN
    BEGIN
      INSERT INTO public.providers (
        user_id,
        name, 
        provider_type, 
        description, 
        capabilities, 
        contact_info
      )
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data ->> 'organization_name', 
          NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'
        ),
        'business',
        'Organization provider account',
        '["organization_services", "card_sharing"]'::jsonb,
        jsonb_build_object(
          'email', NEW.email,
          'representative', 
          CASE 
            WHEN NEW.raw_user_meta_data ->> 'first_name' IS NOT NULL 
                 AND NEW.raw_user_meta_data ->> 'last_name' IS NOT NULL 
            THEN NEW.raw_user_meta_data ->> 'first_name' || ' ' || NEW.raw_user_meta_data ->> 'last_name'
            ELSE NULL 
          END
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create provider for user %: %', NEW.id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;