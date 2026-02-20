-- correctly categorize services (movie vs bus vs appointment).

-- ⚠️ Drop existing function first because we are changing the return type
-- (PostgreSQL doesn't allow REPLACE if the return schema changes)
DROP FUNCTION IF EXISTS hybrid_search(text, vector, text, text, integer, numeric, decimal, integer);
DROP FUNCTION IF EXISTS hybrid_search(text, vector, text, text, integer, numeric, numeric, integer);

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
    type text, -- ✅ ADDED
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
               CAST(0 AS real) as text_score_raw
        FROM vector_matches vm
        WHERE vm.sid NOT IN (SELECT tm.sid FROM text_matches tm)
    ),

    -- Normalize scores and apply filters
    scored AS (
        SELECT
            c.*,
            COALESCE(CAST(c.text_score_raw / NULLIF(MAX(c.text_score_raw) OVER (), 0) AS numeric), 0) as norm_text_score,
            COALESCE(CAST((SELECT v.vector_score_raw FROM vector_matches v WHERE v.sid = c.sid) AS numeric), 0) as norm_vector_score,
            COALESCE(CAST((c.s_rating_avg - 1.0) / 4.0 AS numeric), 0.5) as norm_business_score
        FROM all_candidates c
        WHERE
            (p_category IS NULL OR c.s_category = p_category)
            AND (p_location IS NULL OR c.s_location ILIKE '%' || p_location || '%')
            AND (p_min_capacity IS NULL OR c.s_capacity >= p_min_capacity)
            AND (p_max_price IS NULL OR c.s_price <= p_max_price)
            AND (p_min_rating IS NULL OR c.s_rating_avg >= p_min_rating)
    )

    -- Final ranking
    SELECT
        sc.sid, 
        sc.s_service_id, 
        sc.s_type, -- ✅ ADDED
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
        CAST((0.35 * sc.norm_text_score + 0.25 * sc.norm_vector_score + 0.40 * sc.norm_business_score) AS numeric) as final_score
    FROM scored sc
    ORDER BY final_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
