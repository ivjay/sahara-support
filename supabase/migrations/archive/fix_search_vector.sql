-- =============================================
-- Fix Search Vector Migration (Trigger Version)
-- =============================================
-- Uses a trigger instead of a generated column to bypass
-- immutability restrictions in PostgreSQL.

-- 1. Ensure search_vector is a regular column
ALTER TABLE services DROP COLUMN IF EXISTS search_vector;
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create Trigger Function
CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(NEW.tags, ' '), '')), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 3. Create Trigger
DROP TRIGGER IF EXISTS trg_services_search_vector_update ON services;
CREATE TRIGGER trg_services_search_vector_update
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();

-- 4. Initial update to populate current rows
UPDATE services SET updated_at = NOW();

-- 5. Re-create index
DROP INDEX IF EXISTS idx_services_search_vector;
CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);

-- 6. Verification
COMMENT ON COLUMN services.search_vector IS 'Enhanced search vector updated via trg_services_search_vector_update';
