-- Copy this entire file and paste in Supabase SQL Editor, then click RUN
-- This populates your database with complete service data

DELETE FROM services;

INSERT INTO services (service_id, type, title, subtitle, description, location, price, currency, category, available, details, tags, "venueId") VALUES
-- BUSES with complete route and timing info
('bus-1', 'bus', 'Deluxe Express', 'Kathmandu → Pokhara', 'AC Deluxe bus service with reclining seats', 'Kathmandu', 1200, 'NPR', 'bus', true, '{"departure":"6:00 AM","duration":"7 hours","busType":"AC Deluxe","seats":"12 available","from":"Kathmandu","to":"Pokhara"}'::jsonb, ARRAY['kathmandu','pokhara','bus','deluxe'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('bus-2', 'bus', 'Tourist Coach', 'Kathmandu → Pokhara', 'Tourist class with extra legroom', 'Kathmandu', 1500, 'NPR', 'bus', true, '{"departure":"7:30 AM","duration":"6.5 hours","busType":"Tourist Deluxe","seats":"8 available","from":"Kathmandu","to":"Pokhara"}'::jsonb, ARRAY['kathmandu','pokhara','tourist'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('bus-9', 'bus', 'Sajha Yatayat', 'Kathmandu → Baglung', 'Government bus service', 'Kathmandu', 1300, 'NPR', 'bus', true, '{"departure":"7:00 PM","duration":"10 hours","busType":"Standard","seats":"15 available","from":"Kathmandu","to":"Baglung"}'::jsonb, ARRAY['kathmandu','baglung','sajha'], 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- FLIGHTS with complete route and timing info
('flight-1', 'flight', 'Buddha Air', 'Kathmandu → Pokhara', 'Daily flights to Pokhara', 'Kathmandu', 4500, 'NPR', 'flight', true, '{"departure":"8:00 AM","arrival":"8:25 AM","duration":"25 min","aircraft":"ATR 72-500","class":"Economy","from":"Kathmandu","to":"Pokhara"}'::jsonb, ARRAY['kathmandu','pokhara','buddha air'], 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
('flight-2', 'flight', 'Yeti Airlines', 'Kathmandu → Pokhara', 'Morning flight service', 'Kathmandu', 4200, 'NPR', 'flight', true, '{"departure":"10:30 AM","arrival":"10:55 AM","duration":"25 min","aircraft":"Jetstream 41","class":"Economy","seats":"5 left","from":"Kathmandu","to":"Pokhara"}'::jsonb, ARRAY['yeti','pokhara'], 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

-- DOCTORS with complete hospital and timing info
('apt-1', 'appointment', 'Dr. Sharma', 'General Physician', 'Experienced general physician for all age groups', 'City Hospital', 500, 'NPR', 'general', true, '{"hospital":"City Hospital","address":"Thapathali, Kathmandu","phone":"+977-1-4240000","experience":"15 years","nextSlot":"Tomorrow 10:00 AM","availableDays":"Mon-Fri","timings":"9AM-5PM","rating":"4.8"}'::jsonb, ARRAY['doctor','physician','hospital'], NULL),
('apt-2', 'appointment', 'Dr. Thapa', 'Cardiologist', 'Heart specialist with 20 years experience', 'Heart Care Center', 1500, 'NPR', 'cardiologist', true, '{"hospital":"Heart Care Center","address":"Maharajgunj, Kathmandu","phone":"+977-1-4412266","experience":"20 years","nextSlot":"Thursday 2:00 PM","availableDays":"Mon,Wed,Thu","timings":"2PM-6PM","rating":"4.9"}'::jsonb, ARRAY['cardiologist','heart','specialist'], NULL),

-- MOVIES with complete showtime info
('movie-1', 'movie', 'Kabaddi 5', 'QFX Cinemas, Labim Mall', 'Latest Nepali blockbuster', 'Labim Mall', 400, 'NPR', 'event', true, '{"showtime":"4:30 PM","endTime":"7:00 PM","language":"Nepali","format":"2D","duration":"2.5 hours","rating":"4.5","cinema":"QFX Labim Mall"}'::jsonb, ARRAY['kabaddi','nepali','movie'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('movie-2', 'movie', 'Avengers: Secret Wars', 'Big Movies, Civil Mall', 'Hollywood superhero movie', 'Civil Mall', 600, 'NPR', 'event', true, '{"showtime":"7:00 PM","endTime":"10:00 PM","language":"English","format":"3D IMAX","duration":"3 hours","rating":"4.8","cinema":"Big Movies"}'::jsonb, ARRAY['avengers','hollywood','imax'], 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Verify
SELECT 'SUCCESS: Services loaded' as status, count(*) as total FROM services;
