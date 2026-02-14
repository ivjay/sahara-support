# 🚀 Sahara Payment Integration - Setup Guide

## What's Been Implemented ✅

### Core Payment Infrastructure
- ✅ Database migration for `payments` table
- ✅ Payment service layer with eSewa and Khalti integration
- ✅ Payment API routes (`/api/payment/initiate`, success/failure callbacks)
- ✅ Updated PaymentStep component with real gateway options
- ✅ Payment success and failure pages
- ✅ Environment variable configuration

### Supported Payment Methods
1. **eSewa** - Most popular digital wallet in Nepal
2. **Khalti** - Second most popular digital wallet
3. **Cash on Counter** - Reserve now, pay later

## 📋 Setup Steps

### Step 1: Run Database Migration

Upload `003_create_payments_table.sql` to your Supabase project:

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Paste the contents of `supabase/migrations/003_create_payments_table.sql`
4. Run the migration

This creates:
- `payments` table for transaction records
- Indexes for fast lookups
- Triggers for automatic timestamp updates
- Foreign key relationship with bookings

### Step 2: Get Payment Gateway Credentials

#### For eSewa:
1. Visit [eSewa Developer Portal](https://developer.esewa.com.np/)
2. Register for a merchant account
3. Complete KYC verification
4. Get your credentials:
   - Merchant Code
   - Secret Key
5. Set up callback URLs in eSewa dashboard

#### For Khalti:
1. Visit [Khalti](https://khalti.com/)
2. Register a business account
3. Complete merchant verification
4. Get your credentials from the dashboard:
   - Public Key
   - Secret Key

### Step 3: Configure Environment Variables

Update your `.env.local` file:

```env
# eSewa Configuration
ESEWA_MERCHANT_CODE=your_merchant_code_here
ESEWA_SECRET_KEY=your_secret_key_here
ESEWA_SUCCESS_URL=https://yourdomain.com/api/payment/esewa/success
ESEWA_FAILURE_URL=https://yourdomain.com/api/payment/esewa/failure

# Khalti Configuration
KHALTI_PUBLIC_KEY=your_public_key_here
KHALTI_SECRET_KEY=your_secret_key_here
KHALTI_RETURN_URL=https://yourdomain.com/api/payment/khalti/callback

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Node Environment
NODE_ENV=production  # or 'development' for testing
```

### Step 4: Testing in Sandbox Mode

Both eSewa and Khalti provide test environments:

**eSewa Sandbox:**
- Automatically used when `NODE_ENV=development`
- URL: `https://uat.esewa.com.np/`
- Test credentials provided by eSewa
- No real money charged

**Khalti Test Mode:**
- Automatically used when `NODE_ENV=development`
- URL: `https://a.khalti.com/`
- Test credentials from Khalti dashboard
- No real money charged

**Testing Flow:**
1. Start the app in development mode
2. Make a booking
3. Select eSewa or Khalti payment
4. You'll be redirected to sandbox/test environment
5. Use test credentials to complete payment
6. Verify callback handling and booking confirmation

### Step 5: Production Deployment

**Before going live:**
1. ✅ Test all payment flows in sandbox
2. ✅ Verify webhook callbacks work correctly
3. ✅ Test payment verification logic
4. ✅ Ensure error handling works properly
5. ✅ Set up monitoring and logging

**Go live:**
1. Set `NODE_ENV=production`
2. Update callback URLs to production domain
3. Register production URLs with eSewa/Khalti
4. Start with small test transactions
5. Monitor for any issues

## 🔄 Payment Flow

### User Journey:
```
1. User completes booking wizard
2. Reaches payment step
3. Selects payment method (eSewa/Khalti/Cash)
4. Clicks "Proceed to Payment"

For Digital Payment (eSewa/Khalti):
5. Booking created with status "Pending Payment"
6. Payment initiated via API
7. User redirected to payment gateway
8. User completes payment on gateway website
9. Gateway redirects back with transaction details
10. System verifies payment
11. Booking status updated to "Confirmed"
12. User sees success page

For Cash Payment:
5. Booking created with status "Confirmed"
6. User sees confirmation immediately
7. Payment collected at counter
```

### Backend Flow:
```
POST /api/payment/initiate
  ↓
Create payment record in database
  ↓
Call payment gateway API
  ↓
Return payment URL/form data
  ↓
Redirect user to gateway
  ↓
User completes payment
  ↓
Gateway callback: GET /api/payment/{gateway}/success
  ↓
Verify payment with gateway API
  ↓
Update payment status to "success"
  ↓
Update booking status to "Confirmed"
  ↓
Redirect to success page
```

## 🔍 Monitoring & Debugging

### Check Payment Status
```sql
-- View all payments
SELECT * FROM payments ORDER BY created_at DESC;

-- Check specific booking payment
SELECT * FROM payments WHERE booking_id = 'BK-XXXXXX';

-- Failed payments
SELECT * FROM payments WHERE status = 'failed';

-- Successful payments today
SELECT * FROM payments
WHERE status = 'success'
AND DATE(created_at) = CURRENT_DATE;
```

### Common Issues

**Issue: Payment initiated but no callback received**
- Check callback URLs are accessible from internet
- Verify URLs match what's configured in gateway dashboard
- Check server logs for errors
- Ensure no firewall blocking gateway IPs

**Issue: Payment verification fails**
- Verify secret keys are correct
- Check signature generation logic
- Ensure amount matches exactly
- Check gateway response format

**Issue: Duplicate payment attempts**
- Check idempotency logic
- Verify transaction_id uniqueness constraint
- Review payment status before creating new record

## 📊 Payment Analytics

Track these metrics:
- Payment success rate by gateway
- Average payment completion time
- Failed payment reasons
- Most popular payment method
- Revenue by service type

Add to Supabase dashboard or use tools like Metabase.

## 🔐 Security Checklist

- ✅ Always verify payment signatures from gateway
- ✅ Use HTTPS only for callbacks
- ✅ Validate amount before updating booking
- ✅ Log all payment attempts
- ✅ Implement rate limiting on payment APIs
- ✅ Store sensitive keys in environment variables
- ✅ Never expose secret keys to frontend
- ✅ Implement idempotency for duplicate callbacks
- ✅ Validate callback source (IP whitelist if possible)

## 🚨 Production Checklist

Before launching:
- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] Sandbox testing completed
- [ ] Error handling tested
- [ ] Callback URLs registered with gateways
- [ ] Success/failure pages working
- [ ] Payment verification logic tested
- [ ] Security review completed
- [ ] Monitoring set up
- [ ] Support process defined

## 💰 Cost Considerations

### Gateway Fees
- **eSewa**: ~1.5-2% per transaction + NPR 10 fee
- **Khalti**: ~2-2.5% per transaction

### Example Calculation
```
Booking Amount: NPR 1,000
eSewa Fee (2%): NPR 20
Merchant Receives: NPR 980

Options:
1. Absorb fee (reduce margin by 2%)
2. Pass to customer (add 2% to price)
3. Add service charge (transparent fee)
```

Decide on pricing strategy and update accordingly.

## 📞 Support

### eSewa Support
- Developer Portal: https://developer.esewa.com.np/
- Email: support@esewa.com.np

### Khalti Support
- Developer Docs: https://docs.khalti.com/
- Email: support@khalti.com

## 🎉 Next Steps

Your payment system is now ready! Next enhancements:

1. **QR Code Generation** - Dynamic QR codes for each payment
2. **Payment Reminders** - SMS/email for pending payments
3. **Refund System** - Handle cancellations and refunds
4. **Payment Reports** - Admin dashboard with analytics
5. **Multiple Currencies** - Support USD, INR, etc.
6. **Recurring Payments** - Subscriptions and memberships

Happy selling! 🚀
