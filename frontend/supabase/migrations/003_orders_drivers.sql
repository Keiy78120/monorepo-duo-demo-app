-- 003_orders_drivers.sql
-- Migration for drivers table and order enhancements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table drivers
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trigger for updated_at on drivers
CREATE TRIGGER set_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_day DATE,
  ADD COLUMN IF NOT EXISTS daily_order_number INTEGER,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_day ON orders(order_day);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_telegram_user_id ON orders(telegram_user_id);

-- Function to get the next daily order number
CREATE OR REPLACE FUNCTION get_next_daily_order_number(p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(daily_order_number), 0) + 1
  INTO next_number
  FROM orders
  WHERE order_day = p_date;

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-set order_day and daily_order_number on insert
CREATE OR REPLACE FUNCTION set_daily_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Set order_day to current date if not provided
  IF NEW.order_day IS NULL THEN
    NEW.order_day := CURRENT_DATE;
  END IF;

  -- Set daily_order_number if not provided
  IF NEW.daily_order_number IS NULL THEN
    NEW.daily_order_number := get_next_daily_order_number(NEW.order_day);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set daily order number
DROP TRIGGER IF EXISTS set_order_daily_number ON orders;
CREATE TRIGGER set_order_daily_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_order_number();

-- Add image_url column to products if it doesn't exist (for uploaded images)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Insert some default drivers for testing
INSERT INTO drivers (name, phone, is_active) VALUES
  ('Marco', '+33 6 12 34 56 78', true),
  ('Karim', '+33 6 98 76 54 32', true)
ON CONFLICT DO NOTHING;
