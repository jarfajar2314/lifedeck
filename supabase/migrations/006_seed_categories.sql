-- Seed default categories for all existing spaces
INSERT INTO public.categories (space_id, name, icon, color)
SELECT s.id, c.name, c.icon, c.color
FROM public.spaces s
CROSS JOIN (
  VALUES 
    ('Food & Dining', 'utensils', '#10B981'),
    ('Transport', 'car', '#3B82F6'),
    ('Shopping', 'shopping-bag', '#8B5CF6'),
    ('Bills & Utilities', 'zap', '#F59E0B'),
    ('Entertainment', 'film', '#EF4444'),
    ('Health', 'heart', '#EC4899'),
    ('Education', 'book', '#6366F1'),
    ('Salary', 'briefcase', '#10B981'),
    ('Freelance', 'laptop', '#14B8A6'),
    ('Investment', 'trending-up', '#06B6D4'),
    ('Gift', 'gift', '#F97316'),
    ('Other', 'more-horizontal', '#6B7280')
) AS c(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories WHERE space_id = s.id
)
ON CONFLICT DO NOTHING;
