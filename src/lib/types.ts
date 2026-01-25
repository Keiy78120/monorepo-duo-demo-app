/**
 * Shared Types for the Cloudflare App
 */

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  images: string[]; // Parsed from JSON
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  variety: string | null;
  cost_price_per_gram: number;
  margin_percentage: number;
  stock_quantity: number | null;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  images: string; // JSON string
  category_id: string | null;
  is_active: number; // SQLite integer
  created_at: string;
  updated_at: string;
  variety: string | null;
  cost_price_per_gram: number;
  margin_percentage: number;
  stock_quantity: number | null;
}

// ============================================================================
// CATEGORY TYPES
// ============================================================================

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
}

// ============================================================================
// PRICING TIER TYPES
// ============================================================================

export interface PricingTier {
  id: string;
  product_id: string;
  quantity_grams: number;
  price: number;
  is_custom_price: boolean;
  sort_order: number;
  created_at: string;
}

export interface PricingTierRow {
  id: string;
  product_id: string;
  quantity_grams: number;
  price: number;
  is_custom_price: number;
  sort_order: number;
  created_at: string;
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export type ReviewStatus = 'pending' | 'published' | 'rejected';

export interface Review {
  id: string;
  product_id: string | null;
  telegram_user_id: string;
  username: string | null;
  rating: number;
  content: string;
  status: ReviewStatus;
  created_at: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  telegram_user_id: string;
  username: string | null;
  items: OrderItem[];
  total: number;
  currency: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_day: string | null;
  daily_order_number: number | null;
  delivery_address: string | null;
  driver_id: string | null;
  driver_name?: string; // Joined from drivers table
}

export interface OrderRow {
  id: string;
  telegram_user_id: string;
  username: string | null;
  items: string; // JSON string
  total: number;
  currency: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_day: string | null;
  daily_order_number: number | null;
  delivery_address: string | null;
  driver_id: string | null;
  driver_name?: string;
}

// ============================================================================
// DRIVER TYPES
// ============================================================================

export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverRow {
  id: string;
  name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface Setting {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
}

export interface SettingRow {
  key: string;
  value: string; // JSON string
  description: string | null;
  updated_at: string;
}

// ============================================================================
// TELEGRAM CONTACT TYPES
// ============================================================================

export interface TelegramContact {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_premium: boolean;
  is_admin: boolean;
  first_seen_at: string;
  last_seen_at: string;
  visits_count: number;
}

export interface TelegramContactRow {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_premium: number;
  is_admin: number;
  first_seen_at: string;
  last_seen_at: string;
  visits_count: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess<T> {
  data?: T;
  success?: boolean;
  message?: string;
}
