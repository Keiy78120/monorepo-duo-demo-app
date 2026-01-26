-- Migration: Add demo_session_id to support multi-user demo isolation
-- Date: 2026-01-26
-- Description: Adds demo_session_id column to orders and reviews tables
--              for session-based data isolation in demo mode

-- ============================================================================
-- ADD demo_session_id TO ORDERS
-- ============================================================================
ALTER TABLE orders ADD COLUMN demo_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_demo_session ON orders(demo_session_id);

-- ============================================================================
-- ADD demo_session_id TO REVIEWS
-- ============================================================================
ALTER TABLE reviews ADD COLUMN demo_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_reviews_demo_session ON reviews(demo_session_id);
