-- Fix security warning: Set search_path for function
CREATE OR REPLACE FUNCTION public.set_family_generation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If parent family unit exists, increment generation
  IF NEW.parent_family_unit_id IS NOT NULL THEN
    SELECT generation_level + 1 INTO NEW.generation_level
    FROM public.family_units
    WHERE id = NEW.parent_family_unit_id;
  END IF;
  
  RETURN NEW;
END;
$$;