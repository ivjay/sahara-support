-- =============================================
-- MASTER MIGRATION - Clean Slate Recreation
-- =============================================
-- Drops and recreates ALL tables with correct structure
-- ⚠️ WARNING: This will delete existing data!
-- =============================================

BEGIN;

-- =============================================
-- STEP 0: DROP EXISTING TABLES (Clean Slate)
-- =============================================

-- Drop in reverse order (to avoid foreign key issues)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS passengers CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS seat_inventory CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS hybrid_search(text, vector, text, text, integer, numeric, decimal, integer) CASCADE;
DROP FUNCTION IF EXISTS reserve_seats(UUID, TEXT, DATE, TIME, TEXT[], TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_services_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_payments_updated_at() CASCADE;

-- Enable pgvector extension FIRST (before creating tables)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- STEP 1: CREATE CORE SERVICES TABLE
-- =============================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    type TEXT,
    subtitle TEXT,
    price NUMERIC(10,2),
    currency TEXT DEFAULT 'NPR',
    location TEXT,
    capacity INTEGER,
    images TEXT[],
    tags TEXT[],
    available BOOLEAN DEFAULT true,
    details JSONB DEFAULT '{}'::jsonb,
    qrCodeUrl TEXT,
    "venueId" UUID,  -- For seat selection (movies, buses, flights)
    -- Hybrid search columns
    embedding vector(768),  -- nomic-embed-text produces 768 dimensions
    search_vector tsvector,  -- ✅ Not generated, will use trigger instead
    rating_avg DECIMAL(3,2) DEFAULT 0.0,
    booking_count_30d INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_available ON services(available);
CREATE INDEX idx_services_service_id ON services(service_id);

-- =============================================
-- STEP 2: CREATE BOOKINGS TABLE
-- =============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE NOT NULL,
    booking_type TEXT NOT NULL,
    user_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    total_price NUMERIC(10,2),
    status TEXT DEFAULT 'pending',
    passenger_count INTEGER DEFAULT 1,
    venue_id UUID,
    event_date DATE,
    event_time TIME,
    session_id TEXT,
    payment_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);

-- =============================================
-- STEP 3: CREATE CONVERSATIONS TABLE
-- =============================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT UNIQUE NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb,
    stage TEXT DEFAULT 'gathering',
    language TEXT DEFAULT 'en',
    booking_type TEXT,
    collected_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_conversation_id ON conversations(conversation_id);

-- =============================================
-- STEP 4: CREATE MVP BOOKING TABLES (001)
-- =============================================

-- Venues (already exists but ensure it's complete)
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    venue_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    seat_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seat Inventory (already exists)
CREATE TABLE seat_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id),
    service_id TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    seat_label TEXT NOT NULL,
    seat_type TEXT NOT NULL DEFAULT 'regular',
    price_override NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'available',
    reserved_by TEXT,
    reserved_until TIMESTAMPTZ,
    booked_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(venue_id, service_id, event_date, event_time, seat_label)
);

CREATE INDEX idx_seat_status ON seat_inventory(venue_id, service_id, event_date, event_time, status);
CREATE INDEX idx_seat_reserved ON seat_inventory(status, reserved_until) WHERE status = 'reserved';

-- Time Slots (MISSING!)
CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id TEXT NOT NULL,
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    status TEXT NOT NULL DEFAULT 'available',
    reserved_by TEXT,
    reserved_until TIMESTAMPTZ,
    booked_by TEXT,
    patient_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(service_id, slot_date, slot_time)
);

CREATE INDEX idx_slot_availability ON time_slots(service_id, slot_date, status);

-- Passengers (MISSING!)
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    passenger_number INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    seat_label TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_passengers_booking ON passengers(booking_id);

-- =============================================
-- STEP 5: CREATE PAYMENTS TABLE (003)
-- =============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    gateway TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NPR',
    status TEXT NOT NULL DEFAULT 'pending',
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    payment_url TEXT,
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Add foreign key to bookings if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bookings_payment_id_fkey'
    ) THEN
        ALTER TABLE bookings ADD CONSTRAINT bookings_payment_id_fkey
        FOREIGN KEY (payment_id) REFERENCES payments(id);
    END IF;
END $$;

-- =============================================
-- STEP 6: CREATE NOTIFICATIONS TABLE (004)
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    booking_id TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    delivered BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMPTZ,
    action_url TEXT,
    icon TEXT,
    priority TEXT DEFAULT 'normal',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_delivered ON notifications(delivered);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE delivered = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- STEP 7: HYBRID SEARCH SYSTEM (005)
-- =============================================
-- (Search columns already included in services table definition above)

-- Search indexes
CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);
CREATE INDEX idx_services_location_text ON services USING GIN(to_tsvector('english', COALESCE(location, '')));
CREATE INDEX idx_services_price ON services(price) WHERE price IS NOT NULL;
CREATE INDEX idx_services_rating ON services(rating_avg DESC) WHERE rating_avg > 0;

-- =============================================
-- STEP 8: CREATE FUNCTIONS
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Auto-update search_vector for services
CREATE OR REPLACE FUNCTION update_services_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(ARRAY_TO_STRING(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ✅ Trigger to auto-update search_vector
DROP TRIGGER IF EXISTS update_services_search_vector_trigger ON services;
CREATE TRIGGER update_services_search_vector_trigger
    BEFORE INSERT OR UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_services_search_vector();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Hybrid search function
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
    text_matches AS (
        SELECT
            s.id AS sid, s.service_id AS s_service_id, s.title AS s_title,
            s.description AS s_description, s.category AS s_category,
            s.location AS s_location, s.capacity AS s_capacity, s.price AS s_price,
            s.rating_avg AS s_rating_avg, s.images AS s_images, s.tags AS s_tags,
            ts_rank_cd(s.search_vector, plainto_tsquery('english', p_search_query)) as text_score_raw
        FROM services s
        WHERE s.search_vector @@ plainto_tsquery('english', p_search_query)
        ORDER BY text_score_raw DESC
        LIMIT 100
    ),
    vector_matches AS (
        SELECT
            s.id AS sid, s.service_id AS s_service_id, s.title AS s_title,
            s.description AS s_description, s.category AS s_category,
            s.location AS s_location, s.capacity AS s_capacity, s.price AS s_price,
            s.rating_avg AS s_rating_avg, s.images AS s_images, s.tags AS s_tags,
            1 - (s.embedding <=> p_query_embedding) as vector_score_raw
        FROM services s
        WHERE p_query_embedding IS NOT NULL AND s.embedding IS NOT NULL
        ORDER BY s.embedding <=> p_query_embedding
        LIMIT 100
    ),
    all_candidates AS (
        SELECT * FROM text_matches
        UNION
        SELECT vm.sid, vm.s_service_id, vm.s_title, vm.s_description, vm.s_category,
               vm.s_location, vm.s_capacity, vm.s_price, vm.s_rating_avg, vm.s_images, vm.s_tags,
               0 as text_score_raw
        FROM vector_matches vm
        WHERE vm.sid NOT IN (SELECT tm.sid FROM text_matches tm)
    ),
    scored AS (
        SELECT
            c.*,
            COALESCE(c.text_score_raw / NULLIF(MAX(c.text_score_raw) OVER (), 0), 0) as norm_text_score,
            COALESCE((SELECT v.vector_score_raw FROM vector_matches v WHERE v.sid = c.sid), 0) as norm_vector_score,
            COALESCE((c.s_rating_avg - 1.0) / 4.0, 0.5) as norm_business_score
        FROM all_candidates c
        WHERE
            (p_category IS NULL OR c.s_category = p_category)
            AND (p_location IS NULL OR c.s_location ILIKE '%' || p_location || '%')
            AND (p_min_capacity IS NULL OR c.s_capacity >= p_min_capacity)
            AND (p_max_price IS NULL OR c.s_price <= p_max_price)
            AND (p_min_rating IS NULL OR c.s_rating_avg >= p_min_rating)
    )
    SELECT
        sc.sid, sc.s_service_id, sc.s_title, sc.s_description, sc.s_category, sc.s_location,
        sc.s_capacity, sc.s_price, sc.s_rating_avg, sc.s_images, sc.s_tags,
        sc.norm_text_score, sc.norm_vector_score, sc.norm_business_score,
        (0.35 * sc.norm_text_score + 0.25 * sc.norm_vector_score + 0.40 * sc.norm_business_score) as computed_final_score
    FROM scored sc
    ORDER BY computed_final_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Seat reservation function
CREATE OR REPLACE FUNCTION reserve_seats(
    p_venue_id UUID,
    p_service_id TEXT,
    p_event_date DATE,
    p_event_time TIME,
    p_seat_labels TEXT[],
    p_session_id TEXT,
    p_ttl_minutes INTEGER DEFAULT 10
)
RETURNS TABLE(out_seat_label TEXT, out_success BOOLEAN, out_message TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_seat TEXT;
    v_expiry TIMESTAMPTZ := now() + (p_ttl_minutes || ' minutes')::INTERVAL;
    v_rows_affected INTEGER;
BEGIN
    UPDATE seat_inventory
    SET status = 'available', reserved_by = NULL, reserved_until = NULL
    WHERE venue_id = p_venue_id AND service_id = p_service_id
      AND event_date = p_event_date AND event_time = p_event_time
      AND status = 'reserved' AND reserved_until < now();

    FOREACH v_seat IN ARRAY p_seat_labels
    LOOP
        UPDATE seat_inventory
        SET status = 'reserved', reserved_by = p_session_id, reserved_until = v_expiry, updated_at = now()
        WHERE venue_id = p_venue_id AND service_id = p_service_id
          AND event_date = p_event_date AND event_time = p_event_time
          AND seat_inventory.seat_label = v_seat AND status = 'available';

        GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
        out_seat_label := v_seat;
        out_success := v_rows_affected > 0;
        out_message := CASE WHEN out_success THEN 'Reserved' ELSE 'Not available' END;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- =============================================
-- STEP 9: SEED DATA
-- =============================================

INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'QFX Labim Mall', 'cinema_hall', 120, '{}'::jsonb),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Deluxe Express Bus', 'bus', 30, '{}'::jsonb),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Buddha Air ATR-72', 'flight', 50, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 10: ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Permissive policies (app uses anon key, not JWT auth)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all select on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all insert on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all update on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all delete on notifications" ON notifications;

CREATE POLICY "Allow all select on notifications" ON notifications
    FOR SELECT USING (true);

CREATE POLICY "Allow all insert on notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on notifications" ON notifications
    FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on notifications" ON notifications
    FOR DELETE USING (true);

-- =============================================
-- STEP 11: GRANT PERMISSIONS
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated;

COMMIT;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT
    '✅ MASTER MIGRATION COMPLETE!' as status,
    (SELECT count(*) FROM services) as services_count,
    (SELECT count(*) FROM bookings) as bookings_count,
    (SELECT count(*) FROM venues) as venues_count,
    (SELECT count(*) FROM notifications) as notifications_count,
    (SELECT count(*) FROM payments) as payments_count;
