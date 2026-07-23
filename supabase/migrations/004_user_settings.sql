-- Add per-space default payment account to space_members
ALTER TABLE public.space_members
  ADD COLUMN IF NOT EXISTS default_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL;
