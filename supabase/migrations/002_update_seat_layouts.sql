-- Update seat layouts to be realistic
-- Run this in Supabase SQL Editor after 001_mvp_complete.sql

-- 1. UPDATE MOVIE VENUE - Cinema style with screen
UPDATE venues
SET seat_config = '{
    "rows": [
        {"label": "A", "seats": [
            {"number": 1, "type": "vip"}, {"number": 2, "type": "vip"}, {"number": 3, "type": "vip"},
            {"number": 4, "type": "vip"}, {"number": 5, "type": "vip"}, null,
            {"number": 6, "type": "vip"}, {"number": 7, "type": "vip"}, {"number": 8, "type": "vip"},
            {"number": 9, "type": "vip"}, {"number": 10, "type": "vip"}
        ]},
        {"label": "B", "seats": [
            {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"},
            {"number": 4, "type": "regular"}, {"number": 5, "type": "regular"}, null,
            {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"},
            {"number": 9, "type": "regular"}, {"number": 10, "type": "regular"}
        ]},
        {"label": "C", "seats": [
            {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"},
            {"number": 4, "type": "regular"}, {"number": 5, "type": "regular"}, null,
            {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"},
            {"number": 9, "type": "regular"}, {"number": 10, "type": "regular"}
        ]},
        {"label": "D", "seats": [
            {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"},
            {"number": 4, "type": "regular"}, {"number": 5, "type": "regular"}, null,
            {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"},
            {"number": 9, "type": "regular"}, {"number": 10, "type": "regular"}
        ]},
        {"label": "E", "seats": [
            {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"},
            {"number": 4, "type": "regular"}, {"number": 5, "type": "regular"}, null,
            {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"},
            {"number": 9, "type": "regular"}, {"number": 10, "type": "regular"}
        ]},
        {"label": "F", "seats": [
            {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"},
            {"number": 4, "type": "regular"}, {"number": 5, "type": "regular"}, null,
            {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"},
            {"number": 9, "type": "regular"}, {"number": 10, "type": "regular"}
        ]}
    ]
}'::jsonb,
capacity = 60
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 2. UPDATE BUS VENUE - 2 rows, 18 columns (like a real bus)
UPDATE venues
SET seat_config = '{
    "rows": [
        {"label": "Left", "seats": [
            {"number": 1, "type": "window"}, {"number": 2, "type": "aisle"}, {"number": 3, "type": "aisle"},
            {"number": 4, "type": "aisle"}, {"number": 5, "type": "aisle"}, {"number": 6, "type": "aisle"},
            {"number": 7, "type": "aisle"}, {"number": 8, "type": "aisle"}, {"number": 9, "type": "aisle"},
            {"number": 10, "type": "aisle"}, {"number": 11, "type": "aisle"}, {"number": 12, "type": "aisle"},
            {"number": 13, "type": "aisle"}, {"number": 14, "type": "aisle"}, {"number": 15, "type": "aisle"},
            {"number": 16, "type": "aisle"}, {"number": 17, "type": "aisle"}, {"number": 18, "type": "window"}
        ]},
        {"label": "Right", "seats": [
            {"number": 1, "type": "window"}, {"number": 2, "type": "aisle"}, {"number": 3, "type": "aisle"},
            {"number": 4, "type": "aisle"}, {"number": 5, "type": "aisle"}, {"number": 6, "type": "aisle"},
            {"number": 7, "type": "aisle"}, {"number": 8, "type": "aisle"}, {"number": 9, "type": "aisle"},
            {"number": 10, "type": "aisle"}, {"number": 11, "type": "aisle"}, {"number": 12, "type": "aisle"},
            {"number": 13, "type": "aisle"}, {"number": 14, "type": "aisle"}, {"number": 15, "type": "aisle"},
            {"number": 16, "type": "aisle"}, {"number": 17, "type": "aisle"}, {"number": 18, "type": "window"}
        ]}
    ]
}'::jsonb,
capacity = 36
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 3. UPDATE FLIGHT VENUE - 2 rows, 18 columns (aircraft style)
UPDATE venues
SET seat_config = '{
    "rows": [
        {"label": "A", "seats": [
            {"number": 1, "type": "business"}, {"number": 2, "type": "business"}, {"number": 3, "type": "business"},
            {"number": 4, "type": "economy"}, {"number": 5, "type": "economy"}, {"number": 6, "type": "economy"},
            {"number": 7, "type": "economy"}, {"number": 8, "type": "economy"}, {"number": 9, "type": "economy"},
            {"number": 10, "type": "economy"}, {"number": 11, "type": "economy"}, {"number": 12, "type": "economy"},
            {"number": 13, "type": "economy"}, {"number": 14, "type": "economy"}, {"number": 15, "type": "economy"},
            {"number": 16, "type": "economy"}, {"number": 17, "type": "economy"}, {"number": 18, "type": "economy"}
        ]},
        {"label": "B", "seats": [
            {"number": 1, "type": "business"}, {"number": 2, "type": "business"}, {"number": 3, "type": "business"},
            {"number": 4, "type": "economy"}, {"number": 5, "type": "economy"}, {"number": 6, "type": "economy"},
            {"number": 7, "type": "economy"}, {"number": 8, "type": "economy"}, {"number": 9, "type": "economy"},
            {"number": 10, "type": "economy"}, {"number": 11, "type": "economy"}, {"number": 12, "type": "economy"},
            {"number": 13, "type": "economy"}, {"number": 14, "type": "economy"}, {"number": 15, "type": "economy"},
            {"number": 16, "type": "economy"}, {"number": 17, "type": "economy"}, {"number": 18, "type": "economy"}
        ]}
    ]
}'::jsonb,
capacity = 36
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Success message
SELECT 'Seat layouts updated successfully! Movies: 6 rows, Buses: 2 long rows, Flights: 2 long rows' as result;
