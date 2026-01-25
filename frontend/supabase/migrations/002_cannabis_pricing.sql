-- 002_cannabis_pricing.sql
-- VHash Cannabis Dispensary - Dynamic Pricing System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. Product Categories Table
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_categories_slug ON product_categories(slug);
CREATE INDEX idx_product_categories_sort ON product_categories(sort_order);
CREATE INDEX idx_product_categories_active ON product_categories(is_active);

-- =====================================================
-- 2. Modify Products Table
-- =====================================================
-- Add new columns for cannabis pricing
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variety VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cost_price_per_gram INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_percentage INTEGER DEFAULT 50;

CREATE INDEX idx_products_category_id ON products(category_id);

-- =====================================================
-- 3. Pricing Tiers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity_grams INTEGER NOT NULL,
  price INTEGER NOT NULL,
  is_custom_price BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, quantity_grams)
);

CREATE INDEX idx_pricing_tiers_product ON pricing_tiers(product_id);
CREATE INDEX idx_pricing_tiers_sort ON pricing_tiers(sort_order);

-- =====================================================
-- 4. Sample Categories
-- =====================================================
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
  ('Frozen From Hashland', 'frozen-hashland', 'Premium frozen hash from Hashland', 1),
  ('Hash Premium', 'hash-premium', 'High quality premium hash', 2),
  ('Flower Indoor', 'flower-indoor', 'Indoor grown flower', 3),
  ('Flower Outdoor', 'flower-outdoor', 'Outdoor grown flower', 4),
  ('Edibles', 'edibles', 'Cannabis edibles and infused products', 5),
  ('Concentrates', 'concentrates', 'Cannabis concentrates and extracts', 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 5. Clean up old sample products (optional)
-- =====================================================
-- DELETE FROM products WHERE category IN ('fruits', 'vegetables', 'dairy', 'bakery', 'beverages');

-- =====================================================
-- 6. Helper function for price calculation
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_selling_price(
  cost_per_gram INTEGER,
  margin_percent INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(cost_per_gram * (1 + margin_percent::DECIMAL / 100));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_tier_price(
  cost_per_gram INTEGER,
  margin_percent INTEGER,
  quantity INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(cost_per_gram * (1 + margin_percent::DECIMAL / 100) * quantity);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 7. View for products with calculated prices
-- =====================================================
CREATE OR REPLACE VIEW products_with_pricing AS
SELECT
  p.*,
  pc.name as category_name,
  pc.slug as category_slug,
  calculate_selling_price(p.cost_price_per_gram, p.margin_percentage) as selling_price_per_gram,
  (
    SELECT MIN(pt.price)
    FROM pricing_tiers pt
    WHERE pt.product_id = p.id
  ) as min_tier_price,
  (
    SELECT pt.quantity_grams
    FROM pricing_tiers pt
    WHERE pt.product_id = p.id
    ORDER BY pt.price ASC
    LIMIT 1
  ) as min_tier_quantity
FROM products p
LEFT JOIN product_categories pc ON p.category_id = pc.id;
