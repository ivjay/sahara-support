-- =============================================
-- CONSOLIDATED MIGRATION: Fix All Critical Issues
-- =============================================
-- This migration consolidates and fixes:
-- 1. Embedding dimension mismatch (384 → 768)
-- 2. Search vector generation (trigger-based)
-- 3. Hybrid search function conflicts
-- 4. RLS policy enforcement
-- 5. Missing performance indexes
-- 6. Improved business score formula
-- =============================================

-- =============================================
-- SECTION 1: Drop All Conflicting Functions
-- =============================================
-- Clean slate - remove all hybrid_search variants
DROP FUNCTION IF EXISTS hybrid_search(text, vector(384), text, text, integer, numeric, decimal, integer);
DROP FUNCTION IF EXISTS hybrid_search(text, vector(768), text, text, integer, numeric, decimal, integer);
DROP FUNCTION IF EXISTS hybrid_search(text, vector, text, text, integer, numeric, decimal, integer);
DROP FUNCTION IF EXISTS hybrid_search(text, vector, text, text, integer, numeric, numeric, integer);

-- =============================================
-- SECTION 2: Migrate Embeddings (384-dim → 768-dim)
-- =============================================
-- Strategy: Zero-pad existing 384-dim embeddings to 768-dim
-- This is a temporary fix to enable immediate functionality
-- Background job will regenerate optimal quality embeddings later

DO $$
DECLARE
    current_dims INTEGER;
BEGIN
    -- Check current embedding dimension
    SELECT atttypmod - 4 INTO current_dims
    FROM pg_attribute
    WHERE attrelid = 'services'::regclass
    AND attname = 'embedding'
    LIMIT 1;

    -- Only migrate if currently 384-dim
    IF current_dims = 384 THEN
        RAISE NOTICE 'Migrating embeddings from 384-dim to 768-dim...';

        -- Add temporary column for 768-dim embeddings
        ALTER TABLE services ADD COLUMN IF NOT EXISTS embedding_768 vector(768);

        -- Zero-pad existing embeddings
        -- Converts [a1, a2, ..., a384] → [a1, a2, ..., a384, 0, 0, ..., 0]
        UPDATE services
        SET embedding_768 = (
            SELECT ARRAY(
                SELECT CASE
                    WHEN i <= 384 THEN (embedding::text::numeric[])[i]
                    ELSE 0
                END
                FROM generate_series(1, 768) i
            )::vector(768)
        )
        WHERE embedding IS NOT NULL;

        -- Swap columns
        ALTER TABLE services DROP COLUMN embedding;
        ALTER TABLE services RENAME COLUMN embedding_768 TO embedding;

        RAISE NOTICE 'Embedding migration complete. Run backfillServiceEmbeddings() to regenerate optimal quality.';
    ELSIF current_dims = 768 THEN
        RAISE NOTICE 'Embeddings already 768-dim, skipping migration.';
    ELSE
        -- Ensure column exists with correct dimension
        ALTER TABLE services DROP COLUMN IF EXISTS embedding;
        ALTER TABLE services ADD COLUMN embedding vector(768);
        RAISE NOTICE 'Created 768-dim embedding column.';
    END IF;
END $$;

-- =============================================
-- SECTION 3: Fix Search Vector (Trigger-Based)
-- =============================================
-- Replace GENERATED ALWAYS column with trigger-based approach
-- This bypasses PostgreSQL's immutability restrictions

-- Drop existing search_vector if it's a generated column
ALTER TABLE services DROP COLUMN IF EXISTS search_vector CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger function to auto-populate search_vector
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

-- Attach trigger
DROP TRIGGER IF EXISTS trg_services_search_vector_update ON services;
CREATE TRIGGER trg_services_search_vector_update
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();

-- Populate search_vector for existing rows
UPDATE services SET updated_at = NOW() WHERE search_vector IS NULL;

-- Create/recreate GIN index for full-text search
DROP INDEX IF EXISTS idx_services_search_vector;
CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);

COMMENT ON COLUMN services.search_vector IS 'Full-text search vector (trigger-generated from title/type/category/subtitle/description/tags)';

-- =============================================
-- SECTION 4: Add Missing Business Metrics Columns
-- =============================================
-- Ensure all columns exist for business score calculation
ALTER TABLE services
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS booking_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- SECTION 5: Create Performance Indexes
-- =============================================

-- Composite index for seat inventory lookups (fixes N+1 query)
CREATE INDEX IF NOT EXISTS idx_seat_inventory_lookup
ON seat_inventory(venue_id, service_id, event_date, event_time, status);

-- Vector similarity index (IVFFlat)
-- Only create if embeddings exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM services WHERE embedding IS NOT NULL LIMIT 1) THEN
        DROP INDEX IF EXISTS idx_services_embedding;
        CREATE INDEX idx_services_embedding
        ON services USING ivfflat(embedding vector_cosine_ops)
        WITH (lists = 100);
        RAISE NOTICE 'Created vector similarity index';
    ELSE
        RAISE NOTICE 'No embeddings found, skipping vector index';
    END IF;
END $$;

-- Business metrics indexes
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating_avg DESC) WHERE rating_avg > 0;
CREATE INDEX IF NOT EXISTS idx_services_booking_count ON services(booking_count DESC) WHERE booking_count > 0;

-- =============================================
-- SECTION 6: Fix RLS Policies on Notifications
-- =============================================
-- Ensure notifications are properly isolated by user_id
-- The existing policies use current_setting which is correct,
-- but we verify they're properly enforced

-- Verify RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (idempotent)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Recreate with explicit checks
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Backend/service role creates notifications for any user

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (user_id = current_setting('app.user_id', true));

-- =============================================
-- SECTION 7: Final Hybrid Search Function
-- =============================================
-- Unified function with:
-- - 768-dim embeddings
-- - Includes 'type' field in results
-- - Improved business score formula (60% rating + 30% bookings + 10% views)
-- - Explicit numeric casts for type safety

CREATE OR REPLACE FUNCTION hybrid_search(
    p_search_query text,
    p_query_embedding vector(768) DEFAULT NULL,
    p_category text DEFAULT NULL,
    p_location text DEFAULT NULL,
    p_min_capacity integer DEFAULT NULL,
    p_max_price numeric DEFAULT NULL,
    p_min_rating decimal DEFAULT NULL,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    service_id text,
    type text,
    title text,
    description text,
    category text,
    location text,
    capacity integer,
    price numeric,
    rating_avg decimal,
    images text[],
    tags text[],
    text_score numeric,
    vector_score numeric,
    business_score numeric,
    final_score numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH
    -- Text search candidates
    text_matches AS (
        SELECT
            s.id AS sid, s.service_id AS s_service_id, s.type AS s_type, s.title AS s_title,
            s.description AS s_description, s.category AS s_category,
            s.location AS s_location, s.capacity AS s_capacity, s.price AS s_price,
            s.rating_avg AS s_rating_avg, s.images AS s_images, s.tags AS s_tags,
            s.booking_count AS s_booking_count, s.view_count AS s_view_count,
            ts_rank_cd(s.search_vector, plainto_tsquery('english', p_search_query)) as text_score_raw
        FROM services s
        WHERE s.search_vector @@ plainto_tsquery('english', p_search_query)
        ORDER BY text_score_raw DESC
        LIMIT 100
    ),

    -- Vector search candidates
    vector_matches AS (
        SELECT
            s.id AS sid, s.service_id AS s_service_id, s.type AS s_type, s.title AS s_title,
            s.description AS s_description, s.category AS s_category,
            s.location AS s_location, s.capacity AS s_capacity, s.price AS s_price,
            s.rating_avg AS s_rating_avg, s.images AS s_images, s.tags AS s_tags,
            s.booking_count AS s_booking_count, s.view_count AS s_view_count,
            CAST(1 - (s.embedding <=> p_query_embedding) AS double precision) as vector_score_raw
        FROM services s
        WHERE p_query_embedding IS NOT NULL AND s.embedding IS NOT NULL
        ORDER BY s.embedding <=> p_query_embedding
        LIMIT 100
    ),

    -- Union candidates
    all_candidates AS (
        SELECT * FROM text_matches
        UNION
        SELECT vm.sid, vm.s_service_id, vm.s_type, vm.s_title, vm.s_description, vm.s_category,
               vm.s_location, vm.s_capacity, vm.s_price, vm.s_rating_avg, vm.s_images, vm.s_tags,
               vm.s_booking_count, vm.s_view_count,
               CAST(0 AS real) as text_score_raw
        FROM vector_matches vm
        WHERE vm.sid NOT IN (SELECT tm.sid FROM text_matches tm)
    ),

    -- Normalize scores and apply filters
    scored AS (
        SELECT
            c.*,
            -- Normalized text score
            COALESCE(CAST(c.text_score_raw / NULLIF(MAX(c.text_score_raw) OVER (), 0) AS numeric), 0) as norm_text_score,
            -- Normalized vector score
            COALESCE(CAST((SELECT v.vector_score_raw FROM vector_matches v WHERE v.sid = c.sid) AS numeric), 0) as norm_vector_score,
            -- IMPROVED business score: weighted formula
            -- 60% rating quality + 30% booking popularity + 10% view engagement
            COALESCE(
                CAST(
                    0.60 * ((c.s_rating_avg - 1.0) / 4.0) +  -- Normalize 1-5 rating to 0-1
                    0.30 * (LEAST(c.s_booking_count, 100)::numeric / 100.0) +  -- Cap at 100 bookings
                    0.10 * (LEAST(c.s_view_count, 1000)::numeric / 1000.0)  -- Cap at 1000 views
                AS numeric),
                0.5  -- Default to middle if no metrics
            ) as norm_business_score
        FROM all_candidates c
        WHERE
            (p_category IS NULL OR c.s_category = p_category)
            AND (p_location IS NULL OR c.s_location ILIKE '%' || p_location || '%')
            AND (p_min_capacity IS NULL OR c.s_capacity >= p_min_capacity)
            AND (p_max_price IS NULL OR c.s_price <= p_max_price)
            AND (p_min_rating IS NULL OR c.s_rating_avg >= p_min_rating)
    )

    -- Final ranking with explicit casts
    SELECT
        sc.sid,
        sc.s_service_id,
        sc.s_type,
        sc.s_title,
        sc.s_description,
        sc.s_category,
        sc.s_location,
        sc.s_capacity,
        sc.s_price,
        sc.s_rating_avg,
        sc.s_images,
        sc.s_tags,
        CAST(sc.norm_text_score AS numeric) as text_score,
        CAST(sc.norm_vector_score AS numeric) as vector_score,
        CAST(sc.norm_business_score AS numeric) as business_score,
        -- Hybrid scoring: 35% text + 25% vector + 40% business
        CAST((0.35 * sc.norm_text_score + 0.25 * sc.norm_vector_score + 0.40 * sc.norm_business_score) AS numeric) as final_score
    FROM scored sc
    ORDER BY final_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION hybrid_search IS 'Production hybrid search: 768-dim vectors, improved business scoring, includes service type';

-- =============================================
-- SECTION 8: Verification & Comments
-- =============================================

-- Verify changes
DO $$
DECLARE
    embedding_dims INTEGER;
    search_vec_count INTEGER;
    index_exists BOOLEAN;
BEGIN
    -- Check embedding dimension
    SELECT atttypmod - 4 INTO embedding_dims
    FROM pg_attribute
    WHERE attrelid = 'services'::regclass AND attname = 'embedding';

    RAISE NOTICE 'Embedding dimension: %', embedding_dims;

    -- Check search_vector populated
    SELECT COUNT(*) INTO search_vec_count
    FROM services WHERE search_vector IS NOT NULL;

    RAISE NOTICE 'Services with search_vector: %', search_vec_count;

    -- Check index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'seat_inventory'
        AND indexname = 'idx_seat_inventory_lookup'
    ) INTO index_exists;

    RAISE NOTICE 'Seat inventory index exists: %', index_exists;
END $$;

-- Add migration metadata
COMMENT ON COLUMN services.embedding IS 'Vector embedding (768-dim) for semantic search - migrated from 384-dim';

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
-- 1. Run this migration: psql -f 006_consolidate_and_fix.sql
-- 2. Test hybrid_search: SELECT * FROM hybrid_search('test query', NULL, NULL, NULL, NULL, NULL, NULL, 10);
-- 3. Verify RLS: Try accessing another user's notifications (should fail)
-- 4. Schedule background job: Run backfillServiceEmbeddings() to regenerate optimal embeddings
-- =============================================
