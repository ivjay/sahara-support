-- ✅ Create Services Table for Sahara Support System
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS services (
  -- Identity
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT,

  -- Basic Info
  title TEXT NOT NULL,
  subtitle TEXT,

  -- Pricing
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NPR',

  -- Details (Flexible JSON for service-specific fields)
  details JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  available BOOLEAN DEFAULT true,
  qrCodeUrl TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_services_type ON services(type);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_available ON services(available);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all access to services" ON services
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Services table created successfully! ✅' AS status;
