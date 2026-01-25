-- Seed cannabis products with real categories + pricing tiers

-- Remove old food demo products
DELETE FROM products
WHERE slug IN (
  'organic-avocados',
  'premium-ribeye-steak',
  'artisan-sourdough-bread',
  'fresh-atlantic-salmon',
  'organic-baby-spinach',
  'raw-honey'
)
OR category IN ('Fruits', 'Meat', 'Bakery', 'Seafood', 'Vegetables', 'Pantry');

-- Remove old demo reviews (known content)
DELETE FROM reviews
WHERE content ILIKE '%avocados%' OR content ILIKE '%ribeye%' OR content ILIKE '%sourdough%';

-- Insert cannabis products
INSERT INTO products (
  name,
  slug,
  variety,
  description,
  price,
  currency,
  images,
  category,
  category_id,
  tags,
  farm_label,
  origin_flag,
  stock_quantity,
  is_active,
  cost_price_per_gram,
  margin_percentage
) VALUES
  (
    'Tropicana Cookies',
    'tropicana-cookies',
    'Tropicana Cookies',
    'Profil fruite et zeste, notes d''agrumes et d''orange sanguine. Effet energisant et clair, parfait en journee.',
    0,
    'EUR',
    '["/products/flower-1.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'flower-indoor'),
    ARRAY['Fruite', 'Energisant', 'Agrumes'],
    'Indoor Select',
    'US',
    220,
    true,
    600,
    55
  ),
  (
    'Gelato 33',
    'gelato-33',
    'Gelato 33',
    'Aromes cremeux, vanille et dessert. Fleurs compactes avec un rendu doux et puissant.',
    0,
    'EUR',
    '["/products/flower-2.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'flower-indoor'),
    ARRAY['Cremeux', 'Dessert', 'Relaxant'],
    'Private Reserve',
    'US',
    180,
    true,
    650,
    55
  ),
  (
    'Amnesia Haze Outdoor',
    'amnesia-haze-outdoor',
    'Amnesia Haze',
    'Haze classique aux notes citronnees. Profil sativa, effet dynamique et sociable.',
    0,
    'EUR',
    '["/products/flower-3.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'flower-outdoor'),
    ARRAY['Sativa', 'Citron', 'Energisant'],
    'Sun Grown',
    'ES',
    320,
    true,
    420,
    50
  ),
  (
    'Hash Premium Caramello',
    'hash-premium-caramello',
    'Caramello',
    'Hash premium aux notes sucrees et epicees. Texture souple, parfum intense.',
    0,
    'EUR',
    '["/products/hash-1.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'hash-premium'),
    ARRAY['Hash', 'Premium', 'Caramel'],
    'Hash Atelier',
    'MA',
    140,
    true,
    700,
    60
  ),
  (
    'Frozen Hashland Zkittlez',
    'frozen-hashland-zkittlez',
    'Zkittlez',
    'Frozen hash tres aromatique avec un profil bonbon et fruite. Texture blonde et fine.',
    0,
    'EUR',
    '["/products/hash-2.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'frozen-hashland'),
    ARRAY['Frozen', 'Fruite', 'Bonbon'],
    'Hashland',
    'MA',
    90,
    true,
    780,
    60
  ),
  (
    'Rosin Gold',
    'rosin-gold',
    'Rosin Gold',
    'Concentre premium presse a chaud, texture doree et riche en terpenes.',
    0,
    'EUR',
    '["/products/concentrate-1.svg"]'::jsonb,
    NULL,
    (SELECT id FROM product_categories WHERE slug = 'concentrates'),
    ARRAY['Concentre', 'Terpenes', 'Premium'],
    'Lab Select',
    'CA',
    60,
    true,
    900,
    65
  )
ON CONFLICT (slug) DO NOTHING;

-- Insert pricing tiers for seeded products
INSERT INTO pricing_tiers (product_id, quantity_grams, price, is_custom_price, sort_order)
SELECT
  p.id,
  q.quantity,
  calculate_tier_price(p.cost_price_per_gram, p.margin_percentage, q.quantity),
  false,
  q.sort_order
FROM products p
JOIN (
  VALUES (10, 0), (25, 1), (50, 2), (100, 3)
) AS q(quantity, sort_order) ON true
WHERE p.slug IN (
  'tropicana-cookies',
  'gelato-33',
  'amnesia-haze-outdoor',
  'hash-premium-caramello',
  'frozen-hashland-zkittlez',
  'rosin-gold'
)
ON CONFLICT (product_id, quantity_grams) DO NOTHING;
