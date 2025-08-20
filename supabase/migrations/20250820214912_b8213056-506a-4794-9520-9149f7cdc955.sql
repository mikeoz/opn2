-- Enable real-time updates for family_units table
ALTER TABLE public.family_units REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_units;