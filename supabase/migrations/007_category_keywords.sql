CREATE TABLE IF NOT EXISTS public.category_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(space_id, category_id, keyword)
);

CREATE INDEX idx_category_keywords_space ON public.category_keywords(space_id);
CREATE INDEX idx_category_keywords_keyword ON public.category_keywords(keyword);

ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access category keywords in joined spaces"
  ON public.category_keywords
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.space_members
      WHERE space_members.space_id = category_keywords.space_id
      AND space_members.user_id = current_setting('app.user_id', TRUE)::TEXT
    )
  );

-- Seed default keywords for all spaces
INSERT INTO public.category_keywords (id, space_id, category_id, keyword)
SELECT gen_random_uuid(), c.space_id, c.id, unnest(kw.keywords)
FROM public.categories c
JOIN (
  VALUES 
    ('Food & Dining', ARRAY['lunch', 'dinner', 'coffee', 'cafe', 'food', 'grocery', 'eat', 'resto', 'nasi', 'mie', 'bakso', 'sate', 'makan', 'minum', 'kopi', 'teh']),
    ('Transport', ARRAY['gojek', 'grab', 'taxi', 'bensin', 'gas', 'transport', 'ojol', 'gocar', 'gofood', 'parkir', 'toll', 'tol', 'bike', 'motor']),
    ('Shopping', ARRAY['shop', 'baju', 'sepatu', 'barang', 'marketplace', 'tokped', 'shopee', 'lazada', 'belanja', 'retail']),
    ('Bills & Utilities', ARRAY['listrik', 'internet', 'pulsa', 'water', 'bill', 'utility', 'pln', 'bpjs', 'pajak', 'tax', 'subscription']),
    ('Entertainment', ARRAY['movie', 'film', 'game', 'netflix', 'spotify', 'concert', 'ticket', 'tiket', 'nonton', 'music', 'steam']),
    ('Health', ARRAY['doctor', 'obat', 'hospital', 'clinic', 'gym', 'health', 'medis', 'kesehatan', 'fitness', 'vitamin', 'apotek']),
    ('Education', ARRAY['course', 'book', 'buku', 'class', 'tutorial', 'udemy', 'coursera', 'kursus', 'belajar', 'education']),
    ('Salary', ARRAY['salary', 'gaji', 'bulanan', 'pendapatan', 'income', 'paycheck', 'honor']),
    ('Freelance', ARRAY['freelance', 'project', 'client', 'invoice', 'proyek', 'klién']),
    ('Investment', ARRAY['invest', 'saham', 'crypto', 'reksadana', 'emas', 'stock', 'dividen', 'return']),
    ('Gift', ARRAY['gift', 'hadiah', 'present', 'kado', 'donation', 'donasi', 'donate']),
    ('Other', ARRAY['other', 'lainnya', 'misc', 'etc'])
) AS kw(cat_name, keywords)
  ON c.name = kw.cat_name
ON CONFLICT DO NOTHING;

ALTER TABLE public.category_keywords REPLICA IDENTITY FULL;
