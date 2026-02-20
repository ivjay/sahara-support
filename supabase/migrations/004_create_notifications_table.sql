-- =============================================
-- Notifications Table
-- =============================================
-- Stores in-app notifications for booking reminders,
-- confirmations, payment updates, etc.

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    booking_id TEXT,

    -- Notification content
    type TEXT NOT NULL, -- 'confirmation', 'reminder', 'payment', 'update', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT, -- Deep link: '/profile?booking=BK-123'
    icon TEXT, -- Emoji or icon identifier

    -- Status & metadata
    read BOOLEAN DEFAULT FALSE,
    delivered BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category TEXT DEFAULT 'booking', -- 'booking', 'reminder', 'payment', 'system'

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    scheduled_for TIMESTAMPTZ, -- For future scheduled reminders
    read_at TIMESTAMPTZ -- When user read the notification
);

-- Indexes for performance
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for)
    WHERE scheduled_for IS NOT NULL AND delivered = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true); -- Service role or backend creates notifications

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (user_id = current_setting('app.user_id', true));

-- Function to auto-update read_at when marking as read
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.read = TRUE AND OLD.read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_read
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_read_at();

-- Sample notification types reference
COMMENT ON COLUMN notifications.type IS 'Types: confirmation, reminder, payment, update, system';
COMMENT ON COLUMN notifications.priority IS 'Priority: low, normal, high, urgent';
COMMENT ON COLUMN notifications.category IS 'Category: booking, reminder, payment, system';
