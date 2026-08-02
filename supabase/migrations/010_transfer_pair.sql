-- Two-record transfer support: both legs of a transfer use type = 'transfer',
-- linked by transfer_pair_id, with transfer_direction telling which leg is which.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transfer_pair_id UUID,
  ADD COLUMN IF NOT EXISTS transfer_direction TEXT CHECK (transfer_direction IN ('in', 'out'));

CREATE INDEX IF NOT EXISTS idx_transactions_transfer_pair_id ON public.transactions(transfer_pair_id);

-- Backfill: historical transfers were recorded as an outgoing 'transfer' leg
-- paired with an incoming leg mislabeled as 'income' (inflating income totals).
-- For each unpaired 'transfer' row, look for a same-space, same-amount,
-- different-account 'income' row logged within 5 seconds and relink it as the
-- matching 'in' leg. Anything that doesn't find a confident match is left as a
-- plain outgoing transfer (its historical behavior).
DO $$
DECLARE
  r RECORD;
  match_id UUID;
  pair_id UUID;
BEGIN
  FOR r IN
    SELECT id, space_id, account_id, amount, logged_at
    FROM public.transactions
    WHERE type = 'transfer' AND transfer_pair_id IS NULL
  LOOP
    SELECT id INTO match_id
    FROM public.transactions
    WHERE type = 'income'
      AND space_id = r.space_id
      AND amount = r.amount
      AND account_id IS DISTINCT FROM r.account_id
      AND transfer_pair_id IS NULL
      AND ABS(EXTRACT(EPOCH FROM (logged_at - r.logged_at))) < 5
    ORDER BY ABS(EXTRACT(EPOCH FROM (logged_at - r.logged_at)))
    LIMIT 1;

    IF match_id IS NOT NULL THEN
      pair_id := gen_random_uuid();
      UPDATE public.transactions SET transfer_pair_id = pair_id, transfer_direction = 'out' WHERE id = r.id;
      UPDATE public.transactions SET type = 'transfer', transfer_pair_id = pair_id, transfer_direction = 'in' WHERE id = match_id;
    ELSE
      UPDATE public.transactions SET transfer_direction = 'out' WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
