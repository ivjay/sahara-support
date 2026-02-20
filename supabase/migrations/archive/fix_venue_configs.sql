-- =============================================
-- FIX: Venue Seat Configurations
-- =============================================
-- Populates the venues with actual seat layouts so the Seats API works.

-- 1. Cinema Hall (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
UPDATE venues
SET seat_config = '{
  "rows": [
    {
      "label": "A",
      "seats": [
        {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"},
        {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}
      ]
    },
    {
      "label": "B",
      "seats": [
        {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"}, {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"},
        {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}, {"number": 7, "type": "regular"}, {"number": 8, "type": "regular"}
      ]
    },
    {
      "label": "C",
      "seats": [
        {"number": 1, "type": "premium"}, {"number": 2, "type": "premium"}, {"number": 3, "type": "premium"}, {"number": 4, "type": "premium"},
        {"number": 5, "type": "premium"}, {"number": 6, "type": "premium"}, {"number": 7, "type": "premium"}, {"number": 8, "type": "premium"}
      ]
    }
  ]
}'::jsonb
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 2. Deluxe Bus (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)
UPDATE venues
SET seat_config = '{
  "rows": [
    {
      "label": "L",
      "seats": [
        {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"},
        {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"},
        {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}
      ]
    },
    {
      "label": "R",
      "seats": [
        {"number": 1, "type": "regular"}, {"number": 2, "type": "regular"},
        {"number": 3, "type": "regular"}, {"number": 4, "type": "regular"},
        {"number": 5, "type": "regular"}, {"number": 6, "type": "regular"}
      ]
    }
  ]
}'::jsonb
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 3. Flight (cccccccc-cccc-cccc-cccc-cccccccccccc)
UPDATE venues
SET seat_config = '{
  "rows": [
    {
      "label": "1",
      "seats": [{"number": "A", "type": "premium"}, {"number": "B", "type": "premium"}, {"number": "C", "type": "premium"}, {"number": "D", "type": "premium"}]
    },
    {
      "label": "2",
      "seats": [{"number": "A", "type": "regular"}, {"number": "B", "type": "regular"}, {"number": "C", "type": "regular"}, {"number": "D", "type": "regular"}]
    },
    {
      "label": "3",
      "seats": [{"number": "A", "type": "regular"}, {"number": "B", "type": "regular"}, {"number": "C", "type": "regular"}, {"number": "D", "type": "regular"}]
    },
    {
      "label": "4",
      "seats": [{"number": "A", "type": "regular"}, {"number": "B", "type": "regular"}, {"number": "C", "type": "regular"}, {"number": "D", "type": "regular"}]
    }
  ]
}'::jsonb
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

SELECT '✅ Venue configurations updated!' as status;
