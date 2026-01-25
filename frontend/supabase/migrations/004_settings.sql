-- Settings table migration
-- Note: Table already exists in 001_initial_schema.sql with different structure
-- This migration adds the description column if it doesn't exist

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'settings' AND column_name = 'description'
  ) THEN
    ALTER TABLE settings ADD COLUMN description TEXT;
  END IF;
END $$;

-- Insert default settings (using JSONB format from 001_initial_schema)
INSERT INTO settings (key, value) VALUES
  ('order_warning_message', '"⚠️ Important : Assurez-vous d''être disponible à votre adresse. Les livraisons commencent à partir de 12h00. Le délai peut varier selon la demande."'::jsonb),
  ('delivery_start_time', '"12:00"'::jsonb),
  ('min_order_amount', '0'::jsonb)
ON CONFLICT (key) DO NOTHING;

SELECT 'Settings migration applied successfully!' as result;
