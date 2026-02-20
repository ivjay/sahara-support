-- =============================================
-- Hybrid Search System Migration
-- =============================================
-- Adds pgvector, full-text search, and business metrics
-- for production-grade hybrid search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. Add Search Columns to Services
-- =============================================

-- Add vector embedding column (384 dimensions for all-MiniLM-L6-v2)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Add full-text search vector (auto-generated from title/description/tags)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(tags, ' '), '')), 'C')
) STORED;

-- Add business metrics (denormalized for performance)
ALTER TABLE services
ADD COLUMN IF NOT EXISTS rating_avg DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS booking_count_30d INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- =============================================
-- 2. Create Indexes for Performance
-- =============================================

-- Full-text search index (GIN)
CREATE INDEX IF NOT EXISTS idx_services_search_vector
ON services USING GIN(search_vector);

-- Vector similarity index (IVFFlat with 100 lists for ~10k-100k services)
-- Note: This will be built after embeddings are populated
DO $$
BEGIN
    -- Only create if embeddings exist
    IF EXISTS (SELECT 1 FROM services WHERE embedding IS NOT NULL LIMIT 1) THEN
        CREATE INDEX IF NOT EXISTS idx_services_embedding
        ON services USING ivfflat(embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- Structured filter indexes
CREATE INDEX IF NOT EXISTS idx_services_category
ON services(category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_location_text
ON services USING GIN(to_tsvector('english', COALESCE(location, '')));

CREATE INDEX IF NOT EXISTS idx_services_price
ON services(price) WHERE price IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_services_category_location
ON services(category, location) WHERE category IS NOT NULL;

-- Business metrics index
CREATE INDEX IF NOT EXISTS idx_services_rating
ON services(rating_avg DESC) WHERE rating_avg > 0;

-- =============================================
-- 3. Hybrid Search Function
-- =============================================

CREATE OR REPLACE FUNCTION hybrid_search(
    p_search_query text,
    p_query_embedding vector(384) DEFAULT NULL,
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
            s.id,
            s.service_id,
            s.title,
            s.description,
            s.category,
            s.location,
            s.capacity,
            s.price,
            s.rating_avg,
            s.images,
            s.tags,
            ts_rank_cd(s.search_vector, plainto_tsquery('english', p_search_query)) as text_score_raw
        FROM services s
        WHERE s.search_vector @@ plainto_tsquery('english', p_search_query)
        ORDER BY text_score_raw DESC
        LIMIT 100
    ),

    -- Vector search candidates (only if embedding provided)
    vector_matches AS (
        SELECT
            s.id,
            s.service_id,
            s.title,
            s.description,
            s.category,
            s.location,
            s.capacity,
            s.price,
            s.rating_avg,
            s.images,
            s.tags,
            1 - (s.embedding <=> p_query_embedding) as vector_score_raw
        FROM services s
        WHERE p_query_embedding IS NOT NULL
            AND s.embedding IS NOT NULL
        ORDER BY s.embedding <=> p_query_embedding
        LIMIT 100
    ),

    -- Union candidates
    all_candidates AS (
        SELECT * FROM text_matches
        UNION
        SELECT id, service_id, title, description, category, location, capacity, price, rating_avg, images, tags, 0 as text_score_raw
        FROM vector_matches
        WHERE id NOT IN (SELECT id FROM text_matches)
    ),

    -- Normalize scores and apply filters
    scored AS (
        SELECT
            c.id,
            c.service_id,
            c.title,
            c.description,
            c.category,
            c.location,
            c.capacity,
            c.price,
            c.rating_avg,
            c.images,
            c.tags,
            -- Normalize text score
            COALESCE(
                c.text_score_raw / NULLIF(MAX(c.text_score_raw) OVER (), 0),
                0
            ) as text_score,
            -- Get vector score
            COALESCE(
                (SELECT vector_score_raw FROM vector_matches v WHERE v.id = c.id),
                0
            ) as vector_score,
            -- Business score: rating-based for now (can enhance later)
            COALESCE(
                (c.rating_avg - 1.0) / 4.0,  -- Normalize 1-5 rating to 0-1
                0.5  -- Default to middle if no rating
            ) as business_score
        FROM all_candidates c
        WHERE
            (p_category IS NULL OR c.category = p_category)
            AND (p_location IS NULL OR c.location ILIKE '%' || p_location || '%')
            AND (p_min_capacity IS NULL OR c.capacity >= p_min_capacity)
            AND (p_max_price IS NULL OR c.price <= p_max_price)
            AND (p_min_rating IS NULL OR c.rating_avg >= p_min_rating)
    )

    -- Final ranking
    SELECT
        s.id,
        s.service_id,
        s.title,
        s.description,
        s.category,
        s.location,
        s.capacity,
        s.price,
        s.rating_avg,
        s.images,
        s.tags,
        s.text_score,
        s.vector_score,
        s.business_score,
        -- Hybrid scoring formula
        (
            0.35 * s.text_score +           -- Text relevance
            0.25 * s.vector_score +         -- Semantic similarity
            0.40 * s.business_score         -- Quality signals
        ) as final_score
    FROM scored s
    ORDER BY final_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- 4. Helper Functions
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_services_updated_at ON services;
CREATE TRIGGER trigger_update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_services_updated_at();

-- =============================================
-- 5. Create Embedding Index (Manual Step)
-- =============================================
-- Run this AFTER backfilling embeddings:
-- CREATE INDEX idx_services_embedding
-- ON services USING ivfflat(embedding vector_cosine_ops)
-- WITH (lists = 100);

-- =============================================
-- Comments
-- =============================================
COMMENT ON COLUMN services.embedding IS 'Vector embedding (384-dim) for semantic search using all-MiniLM-L6-v2';
COMMENT ON COLUMN services.search_vector IS 'Full-text search vector (auto-generated from title/description/tags)';
COMMENT ON FUNCTION hybrid_search IS 'Production-grade hybrid search combining text, vector, and business signals';
