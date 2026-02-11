-- ============================================
-- SAHARA DATABASE SCHEMA
-- Supabase PostgreSQL Setup
-- Created: Feb 11, 2026
-- ============================================

-- Enable UUID extension (for generating unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: BOOKINGS
-- Stores all user bookings across all services
-- ============================================

CREATE TABLE bookings (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE NOT NULL,
  
  -- User information
  user_id TEXT,
  user_email TEXT,
  user_phone TEXT,
  
  -- Booking details
  booking_type TEXT NOT NULL CHECK (booking_type IN ('movie', 'bus', 'flight', 'doctor', 'salon')),
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- Service-specific details (stored as JSON for flexibility)
  details JSONB NOT NULL,
  
  -- Pricing
  total_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'NPR',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- For future features
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for faster queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_booking_id ON bookings(booking_id);
CREATE INDEX idx_bookings_type ON bookings(booking_type);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================
-- TABLE 2: CONVERSATIONS
-- Stores chat history for context and memory
-- ============================================

CREATE TABLE conversations (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT UNIQUE NOT NULL,
  
  -- User information (can be anonymous)
  user_id TEXT,
  session_id TEXT,
  
  -- Conversation state
  current_stage TEXT DEFAULT 'greeting' CHECK (current_stage IN ('greeting', 'gathering', 'confirming', 'finalized')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ne')),
  
  -- Chat messages (array of message objects)
  messages JSONB DEFAULT '[]'::jsonb,
  
  -- Current booking in progress (if any)
  active_booking_type TEXT,
  collected_details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for faster queries
CREATE INDEX idx_conversations_conversation_id ON conversations(conversation_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================
-- TABLE 3: USERS (Optional - for future)
-- User profiles and preferences
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  
  -- Basic info
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  
  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert a test booking
INSERT INTO bookings (booking_id, booking_type, details, total_price, user_id)
VALUES (
  'BK-TEST-001',
  'movie',
  '{
    "movie_name": "Pathaan",
    "cinema": "QFX Cinemas",
    "showtime": "2026-02-15T18:00:00",
    "seat_type": "premium",
    "quantity": 2
  }'::jsonb,
  1000.00,
  'test-user-123'
);

-- Insert a test conversation
INSERT INTO conversations (conversation_id, user_id, messages, current_stage, language)
VALUES (
  'CONV-TEST-001',
  'test-user-123',
  '[
    {"role": "user", "content": "Hi", "timestamp": "2026-02-11T10:00:00Z"},
    {"role": "assistant", "content": "Hello! How can I help you today?", "timestamp": "2026-02-11T10:00:01Z"}
  ]'::jsonb,
  'greeting',
  'en'
);

-- Success message
SELECT 'Database setup complete! ✅' AS status;
