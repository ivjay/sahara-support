-- ============================================
-- SAHARA MVP: Complete Database Migration
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- 1. CREATE FUNCTION (needed first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. VENUES TABLE
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    venue_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    seat_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. SEAT INVENTORY TABLE
CREATE TABLE IF NOT EXISTS seat_inventory (
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

-- 4. TIME SLOTS TABLE
CREATE TABLE IF NOT EXISTS time_slots (
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

-- 5. PASSENGERS TABLE (SIMPLIFIED)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    passenger_number INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    seat_label TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_passengers_booking ON passengers(booking_id);

-- 6. ATOMIC SEAT RESERVATION FUNCTION
CREATE OR REPLACE FUNCTION reserve_seats(
    p_venue_id UUID,
    p_service_id TEXT,
    p_event_date DATE,
    p_event_time TIME,
    p_seat_labels TEXT[],
    p_session_id TEXT,
    p_ttl_minutes INTEGER DEFAULT 10
)
RETURNS TABLE(seat_label TEXT, success BOOLEAN, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_seat TEXT;
    v_expiry TIMESTAMPTZ := now() + (p_ttl_minutes || ' minutes')::INTERVAL;
    v_rows_affected INTEGER;
BEGIN
    -- Release expired reservations first
    UPDATE seat_inventory
    SET status = 'available', reserved_by = NULL, reserved_until = NULL
    WHERE venue_id = p_venue_id
      AND service_id = p_service_id
      AND event_date = p_event_date
      AND event_time = p_event_time
      AND status = 'reserved'
      AND reserved_until < now();

    -- Try to reserve each seat
    FOREACH v_seat IN ARRAY p_seat_labels
    LOOP
        UPDATE seat_inventory
        SET status = 'reserved',
            reserved_by = p_session_id,
            reserved_until = v_expiry,
            updated_at = now()
        WHERE venue_id = p_venue_id
          AND service_id = p_service_id
          AND event_date = p_event_date
          AND event_time = p_event_time
          AND seat_label = v_seat
          AND status = 'available';

        GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

        seat_label := v_seat;
        success := v_rows_affected > 0;
        message := CASE WHEN success THEN 'Reserved' ELSE 'Not available' END;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- 7. TIME SLOT GENERATION FUNCTION (SIMPLIFIED)
CREATE OR REPLACE FUNCTION generate_time_slots(
    p_service_id TEXT,
    p_date DATE,
    p_start_time TIME DEFAULT '09:00',
    p_end_time TIME DEFAULT '17:00',
    p_interval_minutes INTEGER DEFAULT 15
)
RETURNS TABLE(slot_time TIME, status TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time TIME := p_start_time;
    v_existing_status TEXT;
BEGIN
    WHILE v_current_time < p_end_time LOOP
        SELECT ts.status INTO v_existing_status
        FROM time_slots ts
        WHERE ts.service_id = p_service_id
          AND ts.slot_date = p_date
          AND ts.slot_time = v_current_time;

        IF FOUND THEN
            slot_time := v_current_time;
            status := v_existing_status;
        ELSE
            INSERT INTO time_slots(service_id, slot_date, slot_time, duration_minutes, status)
            VALUES (p_service_id, p_date, v_current_time, p_interval_minutes, 'available')
            ON CONFLICT (service_id, slot_date, slot_time) DO NOTHING;

            slot_time := v_current_time;
            status := 'available';
        END IF;

        RETURN NEXT;
        v_current_time := v_current_time + (p_interval_minutes || ' minutes')::INTERVAL;
    END LOOP;
END;
$$;

-- 8. ALTER EXISTING BOOKINGS TABLE
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS passenger_count INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 9. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE seat_inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE time_slots;

-- 10. SEED DATA (3 VENUES)
INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'QFX Labim Mall',
    'cinema_hall',
    120,
    '{
        "rows": [
            {"label": "A", "seats": [{"number": 1, "type": "vip"}, {"number": 2, "type": "vip"}, {"number": 3, "type": "vip"}, {"number": 4, "type": "vip"}, null, {"number": 5, "type": "vip"}, {"number": 6, "type": "vip"}, {"number": 7, "type": "vip"}, {"number": 8, "type": "vip"}]},
            {"label": "B", "seats": [{"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"}, null, {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}]},
            {"label": "C", "seats": [{"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"}, null, {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}]},
            {"label": "D", "seats": [{"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"}, null, {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}]},
            {"label": "E", "seats": [{"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"}, null, {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}]}
        ]
    }'::jsonb
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Deluxe Express Bus',
    'bus',
    30,
    '{
        "rows": [
            {"label": "1", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "2", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "3", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "4", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "5", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "6", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]},
            {"label": "7", "seats": [{"number": "A", "type": "window"}, {"number": "B", "type": "aisle"}, null, {"number": "C", "type": "aisle"}, {"number": "D", "type": "window"}]}
        ]
    }'::jsonb
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Buddha Air ATR-72',
    'flight',
    50,
    '{
        "rows": [
            {"label": "1", "seats": [{"number": "A", "type": "business"}, {"number": "B", "type": "business"}, null, {"number": "C", "type": "business"}, {"number": "D", "type": "business"}]},
            {"label": "2", "seats": [{"number": "A", "type": "business"}, {"number": "B", "type": "business"}, null, {"number": "C", "type": "business"}, {"number": "D", "type": "business"}]},
            {"label": "3", "seats": [{"number": "A", "type": "economy"}, {"number": "B", "type": "economy"}, {"number": "C", "type": "economy"}, null, {"number": "D", "type": "economy"}, {"number": "E", "type": "economy"}, {"number": "F", "type": "economy"}]},
            {"label": "4", "seats": [{"number": "A", "type": "economy"}, {"number": "B", "type": "economy"}, {"number": "C", "type": "economy"}, null, {"number": "D", "type": "economy"}, {"number": "E", "type": "economy"}, {"number": "F", "type": "economy"}]}
        ]
    }'::jsonb
);

-- 11. GRANT PERMISSIONS
GRANT ALL ON venues TO postgres, anon, authenticated;
GRANT ALL ON seat_inventory TO postgres, anon, authenticated;
GRANT ALL ON time_slots TO postgres, anon, authenticated;
GRANT ALL ON passengers TO postgres, anon, authenticated;

-- DONE!
SELECT '✅ MVP Database Created!' AS status;
SELECT 'Created ' || count(*) || ' venues' AS venues FROM venues;
