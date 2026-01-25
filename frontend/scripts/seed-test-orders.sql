-- Script pour insérer des commandes de test
-- Usage: psql $DATABASE_URL -f scripts/seed-test-orders.sql

-- D'abord, applique la migration si ce n'est pas déjà fait
-- (ignore les erreurs si déjà appliqué)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create drivers table if not exists
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to orders if they don't exist
DO $$
BEGIN
  BEGIN
    ALTER TABLE orders ADD COLUMN order_day DATE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN daily_order_number INTEGER;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN delivery_address TEXT;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE orders ADD COLUMN driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Create function for daily order numbering
CREATE OR REPLACE FUNCTION get_next_daily_order_number(p_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(daily_order_number) + 1 FROM orders WHERE order_day = p_date),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION set_daily_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_day IS NULL THEN
    NEW.order_day := CURRENT_DATE;
  END IF;

  IF NEW.daily_order_number IS NULL THEN
    NEW.daily_order_number := get_next_daily_order_number(NEW.order_day);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_order_daily_number ON orders;
CREATE TRIGGER set_order_daily_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_order_number();

-- Insert test drivers
INSERT INTO drivers (name, phone, is_active) VALUES
  ('Marco', '+33 6 12 34 56 78', true),
  ('Karim', '+33 6 98 76 54 32', true),
  ('Ahmed', '+33 7 45 67 89 01', true)
ON CONFLICT DO NOTHING;

-- Get driver IDs for assignment
DO $$
DECLARE
  marco_id UUID;
  karim_id UUID;
BEGIN
  SELECT id INTO marco_id FROM drivers WHERE name = 'Marco' LIMIT 1;
  SELECT id INTO karim_id FROM drivers WHERE name = 'Karim' LIMIT 1;

  -- Insert test orders
  -- Order 1: Pending order from today
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    notes,
    order_day,
    created_at
  ) VALUES (
    'test_user_001',
    'alice_crypto',
    '[
      {"product_id": "test-1", "product_name": "Tropicana", "tier_id": "tier-1", "quantity_grams": 25, "quantity": 2, "unit_price": 20000, "total_price": 40000}
    ]'::jsonb,
    40000,
    'EUR',
    'pending',
    '15 rue de la Paix, 75001 Paris
Digicode: 1234
Étage: 3ème, porte droite',
    'Appeler avant de monter SVP',
    CURRENT_DATE,
    NOW() - INTERVAL '2 hours'
  );

  -- Order 2: Confirmed order from today, assigned to Marco
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    driver_id,
    order_day,
    created_at
  ) VALUES (
    'test_user_002',
    'bob_weed',
    '[
      {"product_id": "test-2", "product_name": "OG Kush", "tier_id": "tier-2", "quantity_grams": 10, "quantity": 5, "unit_price": 7000, "total_price": 35000},
      {"product_id": "test-3", "product_name": "Gelato", "tier_id": "tier-3", "quantity_grams": 50, "quantity": 1, "unit_price": 42000, "total_price": 42000}
    ]'::jsonb,
    77000,
    'EUR',
    'confirmed',
    '28 avenue des Champs-Élysées, 75008 Paris
Code: A1234
2ème étage',
    marco_id,
    CURRENT_DATE,
    NOW() - INTERVAL '1 hour'
  );

  -- Order 3: In route order from today, assigned to Karim
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    notes,
    driver_id,
    order_day,
    created_at
  ) VALUES (
    'test_user_003',
    'charlie_hash',
    '[
      {"product_id": "test-4", "product_name": "Purple Haze", "tier_id": "tier-4", "quantity_grams": 100, "quantity": 1, "unit_price": 78000, "total_price": 78000}
    ]'::jsonb,
    78000,
    'EUR',
    'shipped',
    '12 place de la République, 75011 Paris
Interphone: DUPONT
Bâtiment B',
    'Livraison urgente',
    karim_id,
    CURRENT_DATE,
    NOW() - INTERVAL '30 minutes'
  );

  -- Order 4: Delivered order from yesterday
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    driver_id,
    order_day,
    created_at,
    updated_at
  ) VALUES (
    'test_user_004',
    'diana_green',
    '[
      {"product_id": "test-5", "product_name": "Amnesia Haze", "tier_id": "tier-5", "quantity_grams": 25, "quantity": 3, "unit_price": 19500, "total_price": 58500}
    ]'::jsonb,
    58500,
    'EUR',
    'delivered',
    '45 boulevard Saint-Germain, 75005 Paris',
    marco_id,
    CURRENT_DATE - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '12 hours'
  );

  -- Order 5: Old pending order from 2 days ago
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    notes,
    order_day,
    created_at
  ) VALUES (
    'test_user_005',
    'eve_420',
    '[
      {"product_id": "test-6", "product_name": "Cookie Kush", "tier_id": "tier-6", "quantity_grams": 10, "quantity": 10, "unit_price": 7200, "total_price": 72000}
    ]'::jsonb,
    72000,
    'EUR',
    'pending',
    '8 rue de Rivoli, 75004 Paris
Code portail: 5678',
    NULL,
    CURRENT_DATE - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  );

  -- Order 6: Cancelled order
  INSERT INTO orders (
    telegram_user_id,
    username,
    items,
    total,
    currency,
    status,
    delivery_address,
    notes,
    order_day,
    created_at,
    updated_at
  ) VALUES (
    'test_user_006',
    'frank_test',
    '[
      {"product_id": "test-7", "product_name": "White Widow", "tier_id": "tier-7", "quantity_grams": 50, "quantity": 2, "unit_price": 39000, "total_price": 78000}
    ]'::jsonb,
    78000,
    'EUR',
    'cancelled',
    '33 rue du Faubourg Saint-Antoine, 75012 Paris',
    'Client a annulé',
    CURRENT_DATE - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '6 hours'
  );

END $$;

-- Display summary
SELECT
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM orders;

SELECT
  order_day,
  COUNT(*) as orders_count,
  STRING_AGG('#' || daily_order_number::text, ', ' ORDER BY daily_order_number) as order_numbers
FROM orders
GROUP BY order_day
ORDER BY order_day DESC
LIMIT 5;

COMMIT;
