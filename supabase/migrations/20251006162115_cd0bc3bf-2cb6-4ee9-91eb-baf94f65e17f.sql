-- Fix security warnings: Set search_path on update_updated_at_column function

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Reapply triggers after function recreation
DROP TRIGGER IF EXISTS update_card_merge_conflicts_updated_at ON public.card_merge_conflicts;
CREATE TRIGGER update_card_merge_conflicts_updated_at
  BEFORE UPDATE ON public.card_merge_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vcf_imports_updated_at ON public.vcf_imports;
CREATE TRIGGER update_vcf_imports_updated_at
  BEFORE UPDATE ON public.vcf_imports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();