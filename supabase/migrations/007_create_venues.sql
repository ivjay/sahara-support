-- Create venues for all services that need them
-- Buses, Flights, and Movies require venue/seat configurations

-- Clean up first (optional, remove if you want to keep existing venues)
DELETE FROM venues WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'a8b47f7d-7f65-4d90-9062-8f9833b448ef'
);

-- 1. MOVIE THEATERS (Cinema halls with seat grids)
INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'QFX Cinemas - Hall 1',
    'movie',
    60,
    '{
        "rows": [
            {
                "label": "A",
                "seats": [
                    {"number": 1, "type": "regular"},
                    {"number": 2, "type": "regular"},
                    {"number": 3, "type": "regular"},
                    {"number": 4, "type": "premium"},
                    {"number": 5, "type": "premium"},
                    {"number": 6, "type": "premium"},
                    {"number": 7, "type": "premium"},
                    {"number": 8, "type": "regular"},
                    {"number": 9, "type": "regular"},
                    {"number": 10, "type": "regular"}
                ]
            },
            {
                "label": "B",
                "seats": [
                    {"number": 1, "type": "regular"},
                    {"number": 2, "type": "regular"},
                    {"number": 3, "type": "premium"},
                    {"number": 4, "type": "premium"},
                    {"number": 5, "type": "premium"},
                    {"number": 6, "type": "premium"},
                    {"number": 7, "type": "premium"},
                    {"number": 8, "type": "premium"},
                    {"number": 9, "type": "regular"},
                    {"number": 10, "type": "regular"}
                ]
            },
            {
                "label": "C",
                "seats": [
                    {"number": 1, "type": "premium"},
                    {"number": 2, "type": "premium"},
                    {"number": 3, "type": "premium"},
                    {"number": 4, "type": "premium"},
                    {"number": 5, "type": "premium"},
                    {"number": 6, "type": "premium"},
                    {"number": 7, "type": "premium"},
                    {"number": 8, "type": "premium"},
                    {"number": 9, "type": "premium"},
                    {"number": 10, "type": "premium"}
                ]
            },
            {
                "label": "D",
                "seats": [
                    {"number": 1, "type": "regular"},
                    {"number": 2, "type": "regular"},
                    {"number": 3, "type": "regular"},
                    {"number": 4, "type": "regular"},
                    {"number": 5, "type": "regular"},
                    {"number": 6, "type": "regular"},
                    {"number": 7, "type": "regular"},
                    {"number": 8, "type": "regular"},
                    {"number": 9, "type": "regular"},
                    {"number": 10, "type": "regular"}
                ]
            },
            {
                "label": "E",
                "seats": [
                    {"number": 1, "type": "regular"},
                    {"number": 2, "type": "regular"},
                    {"number": 3, "type": "regular"},
                    {"number": 4, "type": "regular"},
                    {"number": 5, "type": "regular"},
                    {"number": 6, "type": "regular"},
                    {"number": 7, "type": "regular"},
                    {"number": 8, "type": "regular"},
                    {"number": 9, "type": "regular"},
                    {"number": 10, "type": "regular"}
                ]
            },
            {
                "label": "F",
                "seats": [
                    {"number": 1, "type": "regular"},
                    {"number": 2, "type": "regular"},
                    {"number": 3, "type": "regular"},
                    {"number": 4, "type": "regular"},
                    {"number": 5, "type": "regular"},
                    {"number": 6, "type": "regular"},
                    {"number": 7, "type": "regular"},
                    {"number": 8, "type": "regular"},
                    {"number": 9, "type": "regular"},
                    {"number": 10, "type": "regular"}
                ]
            }
        ]
    }'::jsonb
);

-- 2. BUS TERMINALS (Bus layout with 2x2 seating)
INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Tourist Bus Terminal',
    'bus',
    32,
    '{
        "rows": [
            {
                "label": "1",
                "seats": [
                    {"number": "A", "type": "regular", "label": "1A"},
                    {"number": "B", "type": "regular", "label": "1B"},
                    {"number": "C", "type": "regular", "label": "1C"},
                    {"number": "D", "type": "regular", "label": "1D"}
                ]
            },
            {
                "label": "2",
                "seats": [
                    {"number": "A", "type": "regular", "label": "2A"},
                    {"number": "B", "type": "regular", "label": "2B"},
                    {"number": "C", "type": "regular", "label": "2C"},
                    {"number": "D", "type": "regular", "label": "2D"}
                ]
            },
            {
                "label": "3",
                "seats": [
                    {"number": "A", "type": "premium", "label": "3A"},
                    {"number": "B", "type": "premium", "label": "3B"},
                    {"number": "C", "type": "premium", "label": "3C"},
                    {"number": "D", "type": "premium", "label": "3D"}
                ]
            },
            {
                "label": "4",
                "seats": [
                    {"number": "A", "type": "premium", "label": "4A"},
                    {"number": "B", "type": "premium", "label": "4B"},
                    {"number": "C", "type": "premium", "label": "4C"},
                    {"number": "D", "type": "premium", "label": "4D"}
                ]
            },
            {
                "label": "5",
                "seats": [
                    {"number": "A", "type": "regular", "label": "5A"},
                    {"number": "B", "type": "regular", "label": "5B"},
                    {"number": "C", "type": "regular", "label": "5C"},
                    {"number": "D", "type": "regular", "label": "5D"}
                ]
            },
            {
                "label": "6",
                "seats": [
                    {"number": "A", "type": "regular", "label": "6A"},
                    {"number": "B", "type": "regular", "label": "6B"},
                    {"number": "C", "type": "regular", "label": "6C"},
                    {"number": "D", "type": "regular", "label": "6D"}
                ]
            },
            {
                "label": "7",
                "seats": [
                    {"number": "A", "type": "regular", "label": "7A"},
                    {"number": "B", "type": "regular", "label": "7B"},
                    {"number": "C", "type": "regular", "label": "7C"},
                    {"number": "D", "type": "regular", "label": "7D"}
                ]
            },
            {
                "label": "8",
                "seats": [
                    {"number": "A", "type": "regular", "label": "8A"},
                    {"number": "B", "type": "regular", "label": "8B"},
                    {"number": "C", "type": "regular", "label": "8C"},
                    {"number": "D", "type": "regular", "label": "8D"}
                ]
            }
        ]
    }'::jsonb
);

-- 3. AIRPORT TERMINALS (Airplane layout 3-3 seating)
INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Domestic Airport - ATR 72',
    'flight',
    72,
    '{
        "rows": [
            {
                "label": "1",
                "seats": [
                    {"number": "A", "type": "premium", "label": "1A"},
                    {"number": "B", "type": "premium", "label": "1B"},
                    {"number": "C", "type": "premium", "label": "1C"},
                    {"number": "D", "type": "premium", "label": "1D"},
                    {"number": "E", "type": "premium", "label": "1E"},
                    {"number": "F", "type": "premium", "label": "1F"}
                ]
            },
            {
                "label": "2",
                "seats": [
                    {"number": "A", "type": "premium", "label": "2A"},
                    {"number": "B", "type": "premium", "label": "2B"},
                    {"number": "C", "type": "premium", "label": "2C"},
                    {"number": "D", "type": "premium", "label": "2D"},
                    {"number": "E", "type": "premium", "label": "2E"},
                    {"number": "F", "type": "premium", "label": "2F"}
                ]
            },
            {
                "label": "3",
                "seats": [
                    {"number": "A", "type": "regular", "label": "3A"},
                    {"number": "B", "type": "regular", "label": "3B"},
                    {"number": "C", "type": "regular", "label": "3C"},
                    {"number": "D", "type": "regular", "label": "3D"},
                    {"number": "E", "type": "regular", "label": "3E"},
                    {"number": "F", "type": "regular", "label": "3F"}
                ]
            },
            {
                "label": "4",
                "seats": [
                    {"number": "A", "type": "regular", "label": "4A"},
                    {"number": "B", "type": "regular", "label": "4B"},
                    {"number": "C", "type": "regular", "label": "4C"},
                    {"number": "D", "type": "regular", "label": "4D"},
                    {"number": "E", "type": "regular", "label": "4E"},
                    {"number": "F", "type": "regular", "label": "4F"}
                ]
            },
            {
                "label": "5",
                "seats": [
                    {"number": "A", "type": "regular", "label": "5A"},
                    {"number": "B", "type": "regular", "label": "5B"},
                    {"number": "C", "type": "regular", "label": "5C"},
                    {"number": "D", "type": "regular", "label": "5D"},
                    {"number": "E", "type": "regular", "label": "5E"},
                    {"number": "F", "type": "regular", "label": "5F"}
                ]
            },
            {
                "label": "6",
                "seats": [
                    {"number": "A", "type": "regular", "label": "6A"},
                    {"number": "B", "type": "regular", "label": "6B"},
                    {"number": "C", "type": "regular", "label": "6C"},
                    {"number": "D", "type": "regular", "label": "6D"},
                    {"number": "E", "type": "regular", "label": "6E"},
                    {"number": "F", "type": "regular", "label": "6F"}
                ]
            },
            {
                "label": "7",
                "seats": [
                    {"number": "A", "type": "regular", "label": "7A"},
                    {"number": "B", "type": "regular", "label": "7B"},
                    {"number": "C", "type": "regular", "label": "7C"},
                    {"number": "D", "type": "regular", "label": "7D"},
                    {"number": "E", "type": "regular", "label": "7E"},
                    {"number": "F", "type": "regular", "label": "7F"}
                ]
            },
            {
                "label": "8",
                "seats": [
                    {"number": "A", "type": "regular", "label": "8A"},
                    {"number": "B", "type": "regular", "label": "8B"},
                    {"number": "C", "type": "regular", "label": "8C"},
                    {"number": "D", "type": "regular", "label": "8D"},
                    {"number": "E", "type": "regular", "label": "8E"},
                    {"number": "F", "type": "regular", "label": "8F"}
                ]
            },
            {
                "label": "9",
                "seats": [
                    {"number": "A", "type": "regular", "label": "9A"},
                    {"number": "B", "type": "regular", "label": "9B"},
                    {"number": "C", "type": "regular", "label": "9C"},
                    {"number": "D", "type": "regular", "label": "9D"},
                    {"number": "E", "type": "regular", "label": "9E"},
                    {"number": "F", "type": "regular", "label": "9F"}
                ]
            },
            {
                "label": "10",
                "seats": [
                    {"number": "A", "type": "regular", "label": "10A"},
                    {"number": "B", "type": "regular", "label": "10B"},
                    {"number": "C", "type": "regular", "label": "10C"},
                    {"number": "D", "type": "regular", "label": "10D"},
                    {"number": "E", "type": "regular", "label": "10E"},
                    {"number": "F", "type": "regular", "label": "10F"}
                ]
            },
            {
                "label": "11",
                "seats": [
                    {"number": "A", "type": "regular", "label": "11A"},
                    {"number": "B", "type": "regular", "label": "11B"},
                    {"number": "C", "type": "regular", "label": "11C"},
                    {"number": "D", "type": "regular", "label": "11D"},
                    {"number": "E", "type": "regular", "label": "11E"},
                    {"number": "F", "type": "regular", "label": "11F"}
                ]
            },
            {
                "label": "12",
                "seats": [
                    {"number": "A", "type": "regular", "label": "12A"},
                    {"number": "B", "type": "regular", "label": "12B"},
                    {"number": "C", "type": "regular", "label": "12C"},
                    {"number": "D", "type": "regular", "label": "12D"},
                    {"number": "E", "type": "regular", "label": "12E"},
                    {"number": "F", "type": "regular", "label": "12F"}
                ]
            }
        ]
    }'::jsonb
);

-- 4. HELICOPTER SERVICE (Small venue for heli service)
INSERT INTO venues (id, name, venue_type, capacity, seat_config) VALUES
(
    'a8b47f7d-7f65-4d90-9062-8f9833b448ef',
    'Helicopter Pad - Manang Air',
    'flight',
    6,
    '{
        "rows": [
            {
                "label": "1",
                "seats": [
                    {"number": "A", "type": "premium", "label": "1A"},
                    {"number": "B", "type": "premium", "label": "1B"}
                ]
            },
            {
                "label": "2",
                "seats": [
                    {"number": "C", "type": "premium", "label": "2C"},
                    {"number": "D", "type": "premium", "label": "2D"}
                ]
            },
            {
                "label": "3",
                "seats": [
                    {"number": "E", "type": "premium", "label": "3E"},
                    {"number": "F", "type": "premium", "label": "3F"}
                ]
            }
        ]
    }'::jsonb
);

-- Verify
SELECT 'SUCCESS: Venues created' as status, count(*) as total FROM venues;
