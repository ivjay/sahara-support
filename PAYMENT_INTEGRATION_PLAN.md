# 💳 Payment Integration Plan - Sahara

## Current Status
- ✅ Mock QR code display
- ✅ Cash payment option
- ✅ Admin verification system
- ❌ Real payment gateway integration
- ❌ Automatic payment verification
- ❌ Real QR code generation

## Goal
Integrate REAL payment gateways for Nepal:
1. eSewa (primary)
2. Khalti (secondary)
3. ConnectIPS (bank transfer)
4. Cash (already working)

---

## Phase 1: eSewa Integration (Recommended First)

### Why eSewa?
- Most popular in Nepal
- Easy API integration
- Good documentation
- Supports QR codes
- Instant verification

### Steps to Integrate:

#### 1. Get eSewa Merchant Account
- Register at: https://developer.esewa.com.np/
- Get Merchant Code
- Get Secret Key
- Set Success/Failure URLs

#### 2. Add Environment Variables
```env
# .env.local
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_secret_key
ESEWA_SUCCESS_URL=https://yourdomain.com/api/payment/esewa/success
ESEWA_FAILURE_URL=https://yourdomain.com/api/payment/esewa/failure
```

#### 3. Create Payment API Routes

**`app/api/payment/initiate/route.ts`**
- Receives booking details
- Creates payment session
- Returns payment URL/form
- Stores transaction in database

**`app/api/payment/esewa/success/route.ts`**
- Receives eSewa callback
- Verifies payment signature
- Updates booking status
- Notifies user

**`app/api/payment/esewa/failure/route.ts`**
- Handles failed payments
- Updates booking status
- Notifies user

#### 4. Update PaymentStep Component
- Show eSewa button
- Redirect to eSewa payment page
- Handle return from eSewa
- Show loading states

#### 5. Database Changes
Create `payments` table:
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id TEXT NOT NULL,
    gateway TEXT NOT NULL, -- 'esewa', 'khalti', 'connectips'
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NPR',
    status TEXT NOT NULL, -- 'pending', 'success', 'failed', 'refunded'
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 2: Khalti Integration

### Why Khalti?
- Second most popular
- Good for younger users
- Similar API to eSewa
- Instant verification

### Steps:
1. Register at: https://khalti.com/
2. Get Public Key & Secret Key
3. Similar API routes as eSewa
4. Add Khalti button to PaymentStep

---

## Phase 3: ConnectIPS Integration

### Why ConnectIPS?
- Bank transfer support
- Trusted by banks
- Good for large amounts
- Slightly slower verification

### Steps:
1. Register as merchant
2. Get API credentials
3. Implement bank selection UI
4. Handle async verification

---

## Phase 4: QR Code Generation

### For eSewa/Khalti:
- Generate dynamic QR codes
- Include: amount, booking ID, merchant code
- Use libraries: `qrcode` npm package

### Implementation:
```typescript
import QRCode from 'qrcode';

// Generate eSewa QR
const qrData = {
    merchant_code: process.env.ESEWA_MERCHANT_CODE,
    amount: totalPrice,
    product_code: bookingId,
    success_url: '/api/payment/esewa/success'
};

const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
```

---

## Technical Architecture

### Payment Flow:

```
User selects payment method
    ↓
Frontend: Show payment options (eSewa/Khalti/ConnectIPS/Cash)
    ↓
User clicks eSewa
    ↓
Frontend: POST /api/payment/initiate
    {
        bookingId: "BK-123",
        amount: 800,
        gateway: "esewa"
    }
    ↓
Backend: Create payment record in database
Backend: Generate eSewa payment form/URL
Backend: Return payment URL
    ↓
Frontend: Redirect user to eSewa
    ↓
eSewa: User completes payment
    ↓
eSewa: Callback to /api/payment/esewa/success?txnId=XXX
    ↓
Backend: Verify payment with eSewa API
Backend: Update payment status to "success"
Backend: Update booking status to "Confirmed"
Backend: Send notification to user
    ↓
Frontend: Redirect back to app
Frontend: Show success message + receipt
```

### Database Schema:

```sql
-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY,
    booking_id TEXT NOT NULL,
    gateway TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Add index for fast lookups
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
```

---

## Security Considerations

### 1. Signature Verification
- Always verify eSewa/Khalti signatures
- Use HMAC-SHA256 for validation
- Never trust client data

### 2. Idempotency
- Handle duplicate callbacks
- Use transaction_id as unique key
- Prevent double-charging

### 3. Amount Validation
- Verify amount matches booking
- Check currency matches
- Validate before updating status

### 4. Webhook Security
- Verify callback source (IP whitelist)
- Use HTTPS only
- Log all payment attempts

---

## Frontend Components

### PaymentMethodSelector Component
```typescript
interface PaymentMethod {
    id: 'esewa' | 'khalti' | 'connectips' | 'cash';
    name: string;
    logo: string;
    description: string;
    processingTime: string;
}

const methods: PaymentMethod[] = [
    {
        id: 'esewa',
        name: 'eSewa',
        logo: '/logos/esewa.png',
        description: 'Digital wallet - Instant payment',
        processingTime: 'Instant'
    },
    {
        id: 'khalti',
        name: 'Khalti',
        logo: '/logos/khalti.png',
        description: 'Digital wallet - Instant payment',
        processingTime: 'Instant'
    },
    // ...
];
```

### Payment Processing Modal
- Show loading state
- Handle redirects
- Display errors
- Show success animation

---

## Testing Strategy

### Test Cases:
1. ✅ Successful payment
2. ✅ Failed payment
3. ✅ Cancelled payment (user backs out)
4. ✅ Timeout (user doesn't complete)
5. ✅ Duplicate payment attempts
6. ✅ Different amounts
7. ✅ Network failures
8. ✅ Invalid signatures

### Test Environments:
- eSewa has sandbox: https://developer.esewa.com.np/
- Khalti has test mode
- Use test credentials first

---

## Monitoring & Analytics

### Track:
- Payment success rate
- Average payment time
- Failed payment reasons
- Gateway performance
- Most used payment method

### Implement:
- Payment logs table
- Dashboard for admins
- Alert for failed payments
- Weekly reports

---

## User Experience

### Before Payment:
- Show total amount clearly
- List all charges
- Show payment method options
- Explain each method

### During Payment:
- Loading animation
- "Redirecting to eSewa..." message
- Don't close browser warning
- Progress indicator

### After Payment:
- Success animation
- Show receipt immediately
- Send SMS/email confirmation
- Provide download option

---

## Cost Considerations

### Gateway Fees:
- **eSewa**: ~1-2% per transaction
- **Khalti**: ~1.5-2.5% per transaction
- **ConnectIPS**: Fixed fee per transaction

### Calculate:
- Pass fees to user OR
- Absorb fees in pricing OR
- Add service charge

---

## Implementation Priority

### ✅ COMPLETED: Core Payment Integration
- ✅ Created payments database table with migration
- ✅ Built payment service layer (eSewa + Khalti)
- ✅ Set up API routes (/api/payment/initiate, callbacks)
- ✅ Updated PaymentStep component with real gateways
- ✅ Created success/failure result pages
- ✅ Added environment variable configuration
- ✅ Updated documentation (README, SETUP.md)

### 🔄 IN PROGRESS: Testing & Deployment
- [ ] Get eSewa merchant account
- [ ] Get Khalti merchant account
- [ ] Test in sandbox environments
- [ ] Run database migration on production
- [ ] Configure production environment variables
- [ ] Deploy to production
- [ ] Test with real money (small amounts)

### 📅 UPCOMING: Enhancements
- [ ] Add QR code generation for payments
- [ ] Implement payment logs dashboard
- [ ] Create admin payment analytics
- [ ] Add SMS/email payment notifications
- [ ] Set up payment monitoring and alerts
- [ ] Add refund functionality
- [ ] Implement payment reminders

### 🔮 FUTURE: Additional Gateways
- [ ] ConnectIPS integration (bank transfer)
- [ ] IME Pay integration
- [ ] Fonepay integration
- [ ] International payments (Stripe/PayPal)

---

## Quick Start Guide

### Option A: eSewa (Recommended)
1. Go to: https://developer.esewa.com.np/
2. Register merchant account
3. Get credentials
4. I'll build the integration!

### Option B: Khalti
1. Go to: https://khalti.com/
2. Register business account
3. Get API keys
4. I'll build the integration!

### Option C: Both!
- Best user experience
- Cover more users
- Fallback options

---

## What I Need From You:

1. **Which gateway first?** (eSewa or Khalti?)
2. **Do you have merchant accounts?** (or should I guide you?)
3. **Test or Production?** (sandbox first or live?)
4. **Fee handling?** (pass to user or absorb?)

Once you decide, I'll build the complete payment system! 🚀
