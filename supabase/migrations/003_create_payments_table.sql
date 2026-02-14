-- Create payments table for tracking payment transactions
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT NOT NULL,
    gateway TEXT NOT NULL, -- 'esewa', 'khalti', 'connectips', 'cash'
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NPR',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    payment_url TEXT,
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON payments(gateway);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER payments_updated_at_trigger
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();

-- Add payment_id reference to bookings table (optional)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);

COMMENT ON TABLE payments IS 'Stores payment transaction records for all booking payments';
COMMENT ON COLUMN payments.gateway IS 'Payment gateway used: esewa, khalti, connectips, or cash';
COMMENT ON COLUMN payments.status IS 'Payment status: pending, success, failed, or refunded';
COMMENT ON COLUMN payments.transaction_id IS 'Unique transaction ID from payment gateway';
COMMENT ON COLUMN payments.gateway_response IS 'Full response data from payment gateway for verification';
