-- monorepo-duo-demo-app D1 Schema
-- Migration from PostgreSQL to SQLite (D1)
-- Conversions: UUID → TEXT, TIMESTAMPTZ → TEXT (ISO 8601), BOOLEAN → INTEGER (0/1), JSONB → TEXT, ENUM → TEXT with CHECK

-- ============================================================================
-- PRODUCT CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

-- ============================================================================
-- PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  images TEXT DEFAULT '[]',
  category TEXT,
  tags TEXT DEFAULT '[]',
  farm_label TEXT,
  origin_flag TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  category_id TEXT REFERENCES product_categories(id) ON DELETE SET NULL,
  variety TEXT,
  cost_price_per_gram INTEGER DEFAULT 0,
  margin_percentage INTEGER DEFAULT 50,
  stock_quantity INTEGER
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- ============================================================================
-- PRICING TIERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_grams INTEGER NOT NULL,
  price INTEGER NOT NULL,
  is_custom_price INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE(product_id, quantity_grams)
);

CREATE INDEX IF NOT EXISTS idx_pricing_tiers_product ON pricing_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sort ON pricing_tiers(sort_order);

-- ============================================================================
-- REVIEWS
-- ============================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  telegram_user_id TEXT NOT NULL,
  username TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_telegram_user ON reviews(telegram_user_id);

-- ============================================================================
-- DRIVERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================================
-- ORDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  telegram_user_id TEXT NOT NULL,
  username TEXT,
  items TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  order_day TEXT,
  daily_order_number INTEGER,
  delivery_address TEXT,
  driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_telegram_user ON orders(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_day ON orders(order_day);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);

-- ============================================================================
-- SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ============================================================================
-- TELEGRAM CONTACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS telegram_contacts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  telegram_user_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  language_code TEXT,
  is_premium INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  first_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  visits_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_telegram_contacts_last_seen ON telegram_contacts(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_telegram_contacts_telegram_user_id ON telegram_contacts(telegram_user_id);

-- ============================================================================
-- MODERATORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS moderators (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  telegram_user_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK(role IN ('moderator', 'admin')),
  added_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_moderators_telegram_id ON moderators(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_moderators_role ON moderators(role);

-- ============================================================================
-- ADMIN SESSIONS (Custom auth - replaces Better Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  telegram_user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================================================================
-- SEED DATA: Default Settings
-- ============================================================================
INSERT OR IGNORE INTO settings (key, value, description) VALUES
  ('general', '{"storeName":"Demo Store","currency":"EUR","freeDeliveryThreshold":100,"telegramBotUsername":"demo_bot","maintenanceMode":false}', 'General store settings'),
  ('info', '{"sections":[],"contact":{},"features":[]}', 'Store information'),
  ('order_warning_message', '"⚠️ Attention: Veuillez vérifier votre commande avant de confirmer."', 'Order warning message'),
  ('order_chat_id', '""', 'Telegram chat id receiving orders'),
  ('delivery_start_time', '"14:00"', 'Delivery start time'),
  ('min_order_amount', '50', 'Minimum order amount in cents');

-- ============================================================================
-- SEED DATA: Default Categories
-- ============================================================================
INSERT OR IGNORE INTO product_categories (id, name, slug, description, sort_order, is_active) VALUES
  ('cat-frozen', 'Frozen From Hashland', 'frozen-from-hashland', 'Premium frozen hash products', 1, 1),
  ('cat-hash', 'Hash Premium', 'hash-premium', 'High-quality hash selection', 2, 1),
  ('cat-indoor', 'Flower Indoor', 'flower-indoor', 'Indoor grown flowers', 3, 1),
  ('cat-outdoor', 'Flower Outdoor', 'flower-outdoor', 'Outdoor grown flowers', 4, 1),
  ('cat-edibles', 'Edibles', 'edibles', 'Edible products', 5, 1),
  ('cat-concentrates', 'Concentrates', 'concentrates', 'Concentrated extracts', 6, 1);

-- ============================================================================
-- SEED DATA: Default Drivers
-- ============================================================================
INSERT OR IGNORE INTO drivers (id, name, phone, is_active) VALUES
  ('driver-marco', 'Marco', '+33 6 12 34 56 78', 1),
  ('driver-karim', 'Karim', '+33 6 98 76 54 32', 1);
