-- Enable Realtime for all LifeDeck app tables
-- Required for cross-device live sync via Supabase Realtime

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.spaces REPLICA IDENTITY FULL;
ALTER TABLE public.space_members REPLICA IDENTITY FULL;
ALTER TABLE public.accounts REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.notes REPLICA IDENTITY FULL;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'public.profiles', 'public.spaces', 'public.space_members',
    'public.accounts', 'public.categories',
    'public.transactions', 'public.tasks', 'public.notes'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname || '.' || tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', tbl);
    END IF;
  END LOOP;
END;
$$;
