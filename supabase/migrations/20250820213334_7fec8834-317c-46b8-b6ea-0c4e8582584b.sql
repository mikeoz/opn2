-- Remove duplicate self-referencing FK causing PostgREST ambiguity
ALTER TABLE public.family_units
DROP CONSTRAINT IF EXISTS fk_family_units_parent;