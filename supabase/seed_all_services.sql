-- =============================================
-- SEED ALL SERVICES - One-shot paste into Supabase SQL Editor
-- =============================================
-- This clears existing services and inserts all mock data
-- Embeddings are left NULL (will be backfilled later if needed)
-- =============================================

-- Clear existing services
DELETE FROM services;

-- =============================================
-- BUS SERVICES (10)
-- =============================================
INSERT INTO services (service_id, type, title, subtitle, description, location, price, currency, category, available, details, tags, "venueId") VALUES
('bus-1', 'bus', 'Deluxe Express', 'Kathmandu -> Pokhara', 'AC Deluxe bus service with reclining seats and onboard entertainment', 'Kathmandu', 1200, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"6:00 AM","duration":"7 hours","busType":"AC Deluxe","seats":"12 available"}'::jsonb,
 ARRAY['kathmandu','pokhara','bus','deluxe','express','ac'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-2', 'bus', 'Tourist Coach', 'Kathmandu -> Pokhara', 'Tourist class coach with extra legroom and panoramic windows', 'Kathmandu', 1500, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"7:30 AM","duration":"6.5 hours","busType":"Tourist Deluxe","seats":"8 available"}'::jsonb,
 ARRAY['kathmandu','pokhara','bus','tourist','coach'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-3', 'bus', 'Night Sleeper', 'Kathmandu -> Pokhara', 'Overnight sleeper bus with flat beds and curtains for privacy', 'Kathmandu', 1800, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"8:00 PM","duration":"8 hours","busType":"Sleeper Bus","seats":"5 available"}'::jsonb,
 ARRAY['kathmandu','pokhara','bus','sleeper','night'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-4', 'bus', 'Greenline Travels', 'Kathmandu -> Chitwan', 'Premium AC sofa-seat bus with lunch included on the way to Chitwan', 'Kathmandu', 1400, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Chitwan","departure":"7:00 AM","duration":"6 hours","busType":"AC Sofa Seat","seats":"15 available"}'::jsonb,
 ARRAY['kathmandu','chitwan','bus','greenline','ac','sofa'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-5', 'bus', 'Super Hiace', 'Kathmandu -> Pokhara', 'Frequent micro bus departures every 30 minutes from Kalanki', 'Kathmandu', 1000, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"Every 30 mins","duration":"6 hours","busType":"Micro Bus","seats":"Available"}'::jsonb,
 ARRAY['kathmandu','pokhara','bus','micro','hiace','frequent'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-6', 'bus', 'Baba Adventure', 'Kathmandu -> Chitwan', 'VIP sofa seating with AC and WiFi to Chitwan National Park area', 'Kathmandu', 1600, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Chitwan","departure":"6:30 AM","duration":"5 hours","busType":"VIP Sofa","seats":"10 available"}'::jsonb,
 ARRAY['kathmandu','chitwan','bus','vip','adventure'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-7', 'bus', 'Swift Holidays', 'Kathmandu -> Lumbini', 'Super deluxe overnight bus to the birthplace of Buddha', 'Kathmandu', 1800, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Lumbini","departure":"7:00 PM","duration":"9 hours","busType":"Super Deluxe","seats":"6 available"}'::jsonb,
 ARRAY['kathmandu','lumbini','bus','deluxe','night'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-8', 'bus', 'East West Travels', 'Kathmandu -> Kakarbhatta', 'Long-distance AC deluxe bus to the eastern border town', 'Kathmandu', 2200, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Kakarbhatta","departure":"3:00 PM","duration":"14 hours","busType":"AC Deluxe","seats":"20 available"}'::jsonb,
 ARRAY['kathmandu','kakarbhatta','bus','deluxe','long-distance','east'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-9', 'bus', 'Sajha Yatayat', 'Kathmandu -> Baglung', 'Reliable government-run bus service to Baglung district', 'Kathmandu', 1300, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Baglung","departure":"7:00 PM","duration":"10 hours","busType":"Standard","seats":"15 available"}'::jsonb,
 ARRAY['kathmandu','baglung','bus','sajha','government'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('bus-10', 'bus', 'Jagadamba Travels', 'Kathmandu -> Biratnagar', 'Deluxe bus to Nepal second largest city in the eastern Terai', 'Kathmandu', 2000, 'NPR', 'bus', true,
 '{"from":"Kathmandu","to":"Biratnagar","departure":"4:00 PM","duration":"12 hours","busType":"Deluxe","seats":"8 available"}'::jsonb,
 ARRAY['kathmandu','biratnagar','bus','deluxe','east','terai'],
 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- =============================================
-- FLIGHT SERVICES (9)
-- =============================================
INSERT INTO services (service_id, type, title, subtitle, description, location, price, currency, category, available, details, tags, "venueId") VALUES
('flight-1', 'flight', 'Buddha Air', 'Kathmandu -> Pokhara', 'Daily domestic flights to Pokhara on ATR 72-500 aircraft', 'Kathmandu', 4500, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"8:00 AM","duration":"25 min","aircraft":"ATR 72-500","class":"Economy"}'::jsonb,
 ARRAY['kathmandu','pokhara','flight','buddha air','domestic'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-2', 'flight', 'Yeti Airlines', 'Kathmandu -> Pokhara', 'Morning flight service to Pokhara with mountain views', 'Kathmandu', 4200, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Pokhara","departure":"10:30 AM","duration":"25 min","aircraft":"Jetstream 41","class":"Economy","seats":"5 left"}'::jsonb,
 ARRAY['kathmandu','pokhara','flight','yeti airlines'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-3', 'flight', 'Shree Airlines', 'Kathmandu -> Bhairahawa', 'Premium flight service to Lumbini gateway city Bhairahawa', 'Kathmandu', 5200, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Bhairahawa","departure":"9:00 AM","duration":"35 min","aircraft":"Bombardier Q400","class":"Premium","seats":"Available"}'::jsonb,
 ARRAY['kathmandu','bhairahawa','flight','shree airlines','lumbini'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-4', 'flight', 'Heli Services', 'Kathmandu -> Everest Base Camp', 'Charter helicopter tour to Everest Base Camp with mountain landing', 'Kathmandu', 35000, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Everest Base Camp","departure":"6:00 AM","duration":"3 hours","aircraft":"Airbus H125","class":"Charter"}'::jsonb,
 ARRAY['kathmandu','everest','flight','helicopter','charter','ebc','trek'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-5', 'flight', 'Buddha Air', 'Kathmandu -> Bharatpur', 'Short domestic flight to Bharatpur for Chitwan access', 'Kathmandu', 3800, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Bharatpur","departure":"11:00 AM","duration":"20 min","aircraft":"ATR 42","class":"Economy"}'::jsonb,
 ARRAY['kathmandu','bharatpur','flight','buddha air','chitwan'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-6', 'flight', 'Yeti Airlines', 'Kathmandu -> Biratnagar', 'Afternoon economy flight to eastern Nepal hub Biratnagar', 'Kathmandu', 5500, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Biratnagar","departure":"4:00 PM","duration":"40 min","aircraft":"ATR 72","class":"Economy"}'::jsonb,
 ARRAY['kathmandu','biratnagar','flight','yeti airlines','east'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-7', 'flight', 'Shree Airlines', 'Kathmandu -> Nepalgunj', 'Economy flight to mid-western Nepal hub Nepalgunj', 'Kathmandu', 6500, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Nepalgunj","departure":"3:30 PM","duration":"50 min","aircraft":"CRJ 200","class":"Economy"}'::jsonb,
 ARRAY['kathmandu','nepalgunj','flight','shree airlines','west'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-8', 'flight', 'Buddha Air', 'Kathmandu -> Bhadrapur', 'Economy flight to far-eastern Nepal near Darjeeling border', 'Kathmandu', 7200, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Bhadrapur","departure":"2:00 PM","duration":"45 min","aircraft":"ATR 72","class":"Economy"}'::jsonb,
 ARRAY['kathmandu','bhadrapur','flight','buddha air','east'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

('flight-9', 'flight', 'Sita Air', 'Kathmandu -> Lukla', 'Scenic mountain flight to Lukla for Everest trekking', 'Kathmandu', 18000, 'NPR', 'flight', true,
 '{"from":"Kathmandu","to":"Lukla","departure":"6:30 AM","duration":"30 min","aircraft":"Dornier 228","class":"Tourist"}'::jsonb,
 ARRAY['kathmandu','lukla','flight','sita air','everest','trek'],
 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- =============================================
-- APPOINTMENT / DOCTOR SERVICES (18)
-- =============================================
INSERT INTO services (service_id, type, title, subtitle, description, location, price, currency, category, available, details, tags) VALUES
-- Pediatricians
('apt-ped-1', 'appointment', 'Dr. Suman Shrestha', 'Pediatrician - Child Specialist', 'Experienced child specialist for vaccination, growth monitoring, and general pediatric care', 'Apollo Clinic Kathmandu', 800, 'NPR', 'pediatrician', true,
 '{"hospital":"Apollo Clinic Kathmandu","address":"Kupondole, Lalitpur, Near Yala Maya Kendra","phone":"+977-1-5545678","experience":"12 years","nextSlot":"Tomorrow 10:00 AM","availableDays":"Mon-Sat","timings":"9AM-4PM","rating":"4.9","specialization":"Child Health, Vaccination"}'::jsonb,
 ARRAY['doctor','pediatrician','child','vaccination','apollo']),

('apt-ped-2', 'appointment', 'Dr. Anjali Pradhan', 'Pediatrician - Newborn Care', 'Senior pediatrician specializing in newborn care and child development milestones', 'Grande International Hospital', 1000, 'NPR', 'pediatrician', true,
 '{"hospital":"Grande International Hospital","address":"Dhapasi, Kathmandu, Near Ring Road","phone":"+977-1-4217766","experience":"18 years","nextSlot":"Today 3:00 PM","availableDays":"Mon-Fri","timings":"10AM-5PM","rating":"5.0","specialization":"Newborn Care, Child Development"}'::jsonb,
 ARRAY['doctor','pediatrician','newborn','child','grande']),

('apt-ped-3', 'appointment', 'Dr. Ramesh Khadka', 'Pediatrician - Child Health Expert', 'Child health expert for fever management and common childhood illnesses', 'CIWEC Hospital', 700, 'NPR', 'pediatrician', true,
 '{"hospital":"CIWEC Hospital","address":"Lainchaur, Kathmandu, Near British Embassy","phone":"+977-1-4424111","experience":"10 years","nextSlot":"Tomorrow 2:00 PM","availableDays":"Mon-Fri","timings":"9AM-3PM","rating":"4.7","specialization":"General Child Health, Fever Management"}'::jsonb,
 ARRAY['doctor','pediatrician','child','fever','ciwec']),

-- Psychologists
('apt-psy-1', 'appointment', 'Dr. Priya Lama', 'Clinical Psychologist - Mental Health', 'Licensed clinical psychologist providing therapy for depression, anxiety, and stress', 'Mind Care Nepal', 1500, 'NPR', 'psychologist', true,
 '{"hospital":"Mind Care Nepal","address":"Jhamsikhel, Lalitpur, Near Jhamsikhel Chowk","phone":"+977-1-5547890","experience":"15 years","nextSlot":"Tomorrow 11:00 AM","availableDays":"Mon-Fri","timings":"10AM-6PM","rating":"4.8","specialization":"Therapy, Counseling, Depression, Anxiety"}'::jsonb,
 ARRAY['doctor','psychologist','mental health','therapy','counseling','depression','anxiety']),

('apt-psy-2', 'appointment', 'Dr. Binod Maharjan', 'Psychologist - Cognitive Therapy', 'CBT specialist offering cognitive behavioral therapy and family counseling', 'Sahara Counseling Center', 1200, 'NPR', 'psychologist', true,
 '{"hospital":"Sahara Counseling Center","address":"Baneshwor, Kathmandu, Near Minbhawan","phone":"+977-1-4781234","experience":"10 years","nextSlot":"Today 4:00 PM","availableDays":"Mon,Wed,Fri","timings":"11AM-5PM","rating":"4.6","specialization":"CBT, Mental Health, Family Counseling"}'::jsonb,
 ARRAY['doctor','psychologist','cbt','therapy','family counseling']),

-- General Physician
('apt-1', 'appointment', 'Dr. Sharma', 'General Physician', 'Experienced general physician for all age groups and routine checkups', 'City Hospital', 500, 'NPR', 'general', true,
 '{"hospital":"City Hospital","address":"Thapathali, Kathmandu","phone":"+977-1-4240000","experience":"15 years","nextSlot":"Tomorrow 10:00 AM","availableDays":"Mon-Fri","timings":"9AM-5PM","rating":"4.8"}'::jsonb,
 ARRAY['doctor','physician','general','checkup','city hospital']),

-- Cardiologist
('apt-2', 'appointment', 'Dr. Thapa', 'Cardiologist', 'Senior heart specialist with 20 years experience in cardiac care', 'Heart Care Center', 1500, 'NPR', 'cardiologist', true,
 '{"hospital":"Heart Care Center","address":"Maharajgunj, Kathmandu","phone":"+977-1-4412266","experience":"20 years","nextSlot":"Thursday 2:00 PM","availableDays":"Mon,Wed,Thu","timings":"2PM-6PM","rating":"4.9"}'::jsonb,
 ARRAY['doctor','cardiologist','heart','specialist','cardiac']),

-- Specialists
('apt-urology', 'appointment', 'Dr. Bikash Shrestha', 'Urologist', 'Specialist in kidney and urinary tract disorders', 'Grande International Hospital', 1200, 'NPR', 'doctor', true,
 '{"hospital":"Grande International Hospital","address":"Dhapasi, Kathmandu","phone":"+977-1-4217766","experience":"12 years","nextSlot":"Wed 11:00 AM","availableDays":"Mon,Wed,Fri","timings":"10AM-3PM","rating":"4.7","specialization":"Kidney & Urinary Tract"}'::jsonb,
 ARRAY['doctor','urologist','kidney','urology','specialist','grande']),

('apt-nephro', 'appointment', 'Dr. Pukar Chandra', 'Senior Nephrologist', 'Leading kidney transplant expert with 25 years of experience', 'Sahid Dharma Bhakta Centre', 1800, 'NPR', 'doctor', true,
 '{"hospital":"Sahid Dharma Bhakta Centre","address":"Maharajgunj, Kathmandu","phone":"+977-1-4371066","experience":"25 years","nextSlot":"Fri 9:00 AM","availableDays":"Tue,Thu,Fri","timings":"9AM-1PM","rating":"5.0","specialization":"Kidney Transplant Expert"}'::jsonb,
 ARRAY['doctor','nephrologist','kidney','transplant','specialist']),

('apt-gyno', 'appointment', 'Dr. Sara Pradhan', 'Gynecologist', 'Experienced gynecologist for women health and prenatal care', 'Paropakar Maternity', 1000, 'NPR', 'doctor', true,
 '{"hospital":"Paropakar Maternity","address":"Thapathali, Kathmandu","phone":"+977-1-4260865","experience":"10 years","nextSlot":"Today 3:00 PM","availableDays":"Sun-Fri","timings":"10AM-4PM","rating":"4.6"}'::jsonb,
 ARRAY['doctor','gynecologist','women','maternity','prenatal']),

('apt-3', 'appointment', 'Dr. Rimal', 'Dentist', 'Skilled dentist for dental checkups, fillings, and cosmetic dentistry', 'Smile Clinic', 800, 'NPR', 'doctor', true,
 '{"hospital":"Smile Clinic, Lazimpat","address":"Lazimpat, Kathmandu","phone":"+977-1-4416123","experience":"8 years","nextSlot":"Today 4:00 PM","availableDays":"Sun-Fri","timings":"10AM-6PM","rating":"4.7"}'::jsonb,
 ARRAY['doctor','dentist','dental','teeth','smile clinic']),

('apt-4', 'appointment', 'Dr. Karki', 'Dermatologist', 'Dermatologist specializing in skin conditions, acne, and cosmetic treatments', 'Skin Care Center', 1200, 'NPR', 'doctor', true,
 '{"hospital":"Skin Care Center","address":"Putalisadak, Kathmandu","phone":"+977-1-4231456","experience":"12 years","nextSlot":"Friday 11:00 AM","availableDays":"Mon-Fri","timings":"11AM-5PM","rating":"4.6"}'::jsonb,
 ARRAY['doctor','dermatologist','skin','acne','specialist']),

-- Colleges
('apt-5', 'appointment', 'Presidential Business School', 'Expert Counseling Session', 'Free counseling session for MBA and BBA admission guidance', 'Presidential Business School', 0, 'NPR', 'college', true,
 '{"hospital":"Thapagaun, Baneshwor","address":"Thapagaun, Baneshwor, Kathmandu","phone":"+977-1-4781234","experience":"PBS","nextSlot":"Daily 10AM - 4PM","availableDays":"Sun-Fri","timings":"10AM-4PM","rating":"4.8"}'::jsonb,
 ARRAY['college','counseling','mba','bba','admission','pbs']),

('apt-6', 'appointment', 'Islington College', 'Admission Inquiry', 'Walk-in admission inquiry for IT and Business programs', 'Islington College', 0, 'NPR', 'college', true,
 '{"hospital":"Kamal Pokhari","address":"Kamal Pokhari, Kathmandu","phone":"+977-1-4418234","experience":"IT & Business","nextSlot":"Walk-in Available","availableDays":"Sun-Fri","timings":"9AM-5PM","rating":"4.7"}'::jsonb,
 ARRAY['college','admission','it','business','islington']),

-- Other Services
('svc-1', 'appointment', 'Glow & Style Salon', 'Haircut & Grooming', 'Professional haircut and grooming salon for men and women', 'New Baneshwor', 500, 'NPR', 'salon', true,
 '{"location":"New Baneshwor","address":"New Baneshwor, Kathmandu","specialist":"Rohan","nextSlot":"Today 2:00 PM","availableDays":"Sun-Fri","timings":"10AM-7PM","rating":"4.5"}'::jsonb,
 ARRAY['salon','haircut','grooming','beauty']),

('svc-2', 'appointment', 'Quick Fix Plumbing', 'Emergency Repairs', 'On-call emergency plumbing repair service across Kathmandu valley', 'Kathmandu', 800, 'NPR', 'plumber', true,
 '{"location":"On-site","address":"Kathmandu Valley (On-site Service)","specialist":"Hari Bahadur","responseTime":"1 Hour","availableDays":"Daily","timings":"7AM-8PM","rating":"4.9"}'::jsonb,
 ARRAY['plumber','plumbing','repair','emergency','home service']),

('svc-3', 'appointment', 'City Electric', 'Wiring & Installation', 'Professional electrical wiring and installation service for homes and offices', 'Kathmandu', 1000, 'NPR', 'electrician', true,
 '{"location":"On-site","address":"Kathmandu Valley (On-site Service)","specialist":"Ram Kumar","responseTime":"2 Hours","availableDays":"Daily","timings":"8AM-6PM","rating":"4.8"}'::jsonb,
 ARRAY['electrician','electrical','wiring','installation','home service']),

('svc-4', 'appointment', 'Glamour Studio', 'Party Makeup', 'Professional makeup artist for weddings, parties, and special events', 'Lazimpat', 3500, 'NPR', 'makeup', true,
 '{"location":"Lazimpat","address":"Lazimpat, Kathmandu","specialist":"Sita","nextSlot":"Tomorrow 8:00 AM","availableDays":"By Appointment","timings":"8AM-6PM","rating":"5.0"}'::jsonb,
 ARRAY['makeup','beauty','party','wedding','salon']),

('svc-5', 'appointment', 'Smart Fit Tailoring', 'Custom Suits', 'Custom tailoring for suits, formal wear, and alterations', 'Putalisadak', 8000, 'NPR', 'tailor', true,
 '{"location":"Putalisadak","address":"Putalisadak, Kathmandu","specialist":"Master tailor","delivery":"4 Days","availableDays":"Sun-Fri","timings":"10AM-7PM","rating":"4.7"}'::jsonb,
 ARRAY['tailor','suits','custom','alterations','formal']),

('svc-6', 'appointment', 'Family Care Clinic', 'General Checkup', 'Walk-in family clinic for routine health checkups and minor ailments', 'Koteshwor', 400, 'NPR', 'clinic', true,
 '{"location":"Koteshwor","address":"Koteshwor, Kathmandu","specialist":"Dr. Regmi","nextSlot":"Today 5:00 PM","availableDays":"Sun-Fri","timings":"8AM-8PM","rating":"4.6"}'::jsonb,
 ARRAY['clinic','checkup','family','doctor','walk-in']);

-- =============================================
-- MOVIE / EVENT SERVICES (13)
-- =============================================
INSERT INTO services (service_id, type, title, subtitle, description, location, price, currency, category, available, details, tags, "venueId") VALUES
('movie-1', 'movie', 'Kabaddi 5', 'QFX Cinemas, Labim Mall', 'Latest Nepali blockbuster sequel in the hit Kabaddi franchise', 'QFX Labim Mall', 400, 'NPR', 'event', true,
 '{"cinema":"QFX Cinemas, Labim Mall","showtime":"4:30 PM","endTime":"7:00 PM","language":"Nepali","format":"2D","duration":"2.5 hours","rating":"4.5"}'::jsonb,
 ARRAY['kabaddi','nepali','movie','qfx','labim mall'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-4', 'movie', 'Dune: Part Two', 'Big Movies, Kamalpokhari', 'Epic sci-fi sequel directed by Denis Villeneuve', 'Big Movies Kamalpokhari', 450, 'NPR', 'event', true,
 '{"cinema":"Big Movies, Kamalpokhari","showtime":"6:00 PM","endTime":"9:00 PM","language":"English","format":"2D","duration":"2.75 hours","rating":"4.7"}'::jsonb,
 ARRAY['dune','hollywood','sci-fi','movie','big movies'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-5', 'movie', 'Mahajatra', 'QFX Civil Mall', 'Popular Nepali comedy-drama film', 'QFX Civil Mall', 400, 'NPR', 'event', true,
 '{"cinema":"QFX Civil Mall","showtime":"3:00 PM","endTime":"5:30 PM","language":"Nepali","format":"2D","duration":"2.5 hours","rating":"4.6"}'::jsonb,
 ARRAY['mahajatra','nepali','movie','comedy','qfx','civil mall'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-6', 'movie', 'Kung Fu Panda 4', 'One Cinemas, Baneshwor', 'Animated adventure comedy for the whole family', 'One Cinemas Baneshwor', 500, 'NPR', 'event', true,
 '{"cinema":"One Cinemas, Baneshwor","showtime":"1:00 PM","endTime":"3:00 PM","language":"English","format":"3D","duration":"2 hours","rating":"4.5"}'::jsonb,
 ARRAY['kung fu panda','animation','hollywood','movie','3d','kids','family'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-7', 'movie', 'Shaitaan', 'FCube Cinemas, Chabahil', 'Gripping Hindi psychological thriller', 'FCube Cinemas Chabahil', 350, 'NPR', 'event', true,
 '{"cinema":"FCube Cinemas, Chabahil","showtime":"8:00 PM","endTime":"10:30 PM","language":"Hindi","format":"2D","duration":"2.5 hours","rating":"4.2"}'::jsonb,
 ARRAY['shaitaan','hindi','bollywood','movie','thriller','fcube'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-8', 'movie', 'Godzilla x Kong', 'QFX Labim Mall', 'Monster blockbuster showdown in stunning 3D', 'QFX Labim Mall', 550, 'NPR', 'event', true,
 '{"cinema":"QFX Labim Mall","showtime":"5:30 PM","endTime":"8:00 PM","language":"English","format":"3D","duration":"2.5 hours","rating":"4.1"}'::jsonb,
 ARRAY['godzilla','kong','hollywood','movie','3d','action','qfx'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-2', 'movie', 'Avengers: Secret Wars', 'Big Movies, Civil Mall', 'Marvel superhero blockbuster in 3D IMAX', 'Big Movies Civil Mall', 600, 'NPR', 'event', true,
 '{"cinema":"Big Movies, Civil Mall","showtime":"7:00 PM","endTime":"10:00 PM","language":"English","format":"3D IMAX","duration":"3 hours","rating":"4.8"}'::jsonb,
 ARRAY['avengers','marvel','hollywood','movie','imax','3d','superhero'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('movie-3', 'movie', 'Pashupati Prasad 2', 'QFX Chhaya Center', 'Beloved Nepali comedy sequel with heart and humor', 'QFX Chhaya Center', 350, 'NPR', 'event', true,
 '{"cinema":"QFX Chhaya Center","showtime":"1:00 PM","endTime":"3:30 PM","language":"Nepali","format":"2D","duration":"2.5 hours","rating":"4.9"}'::jsonb,
 ARRAY['pashupati prasad','nepali','movie','comedy','qfx'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('event-1', 'movie', 'Apoorwa Kshitiz Standup', 'Pragya Pratisthan, Kamaladi', 'Live standup comedy show by popular Nepali comedian', 'Pragya Pratisthan Kamaladi', 1500, 'NPR', 'standup', true,
 '{"cinema":"Pragya Pratisthan, Kamaladi","showtime":"Sat 4:00 PM","endTime":"Sat 6:00 PM","language":"Nepali","format":"Live Comedy","duration":"2 hours","rating":"4.9"}'::jsonb,
 ARRAY['standup','comedy','live','nepali','event'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('event-2', 'movie', 'Nepathya Live in Kathmandu', 'Dasarath Rangasala Stadium', 'Live rock concert by legendary Nepali band Nepathya', 'Dasarath Rangasala Stadium', 2000, 'NPR', 'concert', true,
 '{"cinema":"Dasarath Rangasala Stadium","showtime":"Fri 6:00 PM","endTime":"Fri 9:00 PM","language":"Nepali Rock","format":"Live Concert","duration":"3 hours","rating":"5.0"}'::jsonb,
 ARRAY['nepathya','concert','live','music','rock','nepali','event'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('event-3', 'movie', 'Palpasa Cafe (Theatre Play)', 'Mandala Theatre, Anamnagar', 'Acclaimed stage adaptation of the bestselling Nepali novel', 'Mandala Theatre Anamnagar', 500, 'NPR', 'drama', true,
 '{"cinema":"Mandala Theatre, Anamnagar","showtime":"Daily 5:00 PM","endTime":"Daily 7:00 PM","language":"Nepali","format":"Drama","duration":"2 hours","rating":"4.7"}'::jsonb,
 ARRAY['palpasa cafe','theatre','drama','play','nepali','event'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),

('event-4', 'movie', 'Cultural Dance Night', 'Bhojan Griha, Dillibazar', 'Traditional Nepali folk dance with authentic dinner experience', 'Bhojan Griha Dillibazar', 2500, 'NPR', 'dance', true,
 '{"cinema":"Bhojan Griha, Dillibazar","showtime":"7:00 PM","endTime":"9:30 PM","language":"Folk","format":"Dinner & Dance","duration":"2.5 hours","rating":"4.6"}'::jsonb,
 ARRAY['cultural','dance','folk','dinner','nepali','event','traditional'],
 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- =============================================
-- VERIFY
-- =============================================
SELECT
    'SEED COMPLETE!' as status,
    (SELECT count(*) FROM services) as total_services,
    (SELECT count(*) FROM services WHERE type = 'bus') as buses,
    (SELECT count(*) FROM services WHERE type = 'flight') as flights,
    (SELECT count(*) FROM services WHERE type = 'appointment') as appointments,
    (SELECT count(*) FROM services WHERE type = 'movie') as movies_events;
