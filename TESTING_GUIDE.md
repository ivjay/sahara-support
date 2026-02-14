# 🧪 Payment Testing Guide

## eSewa Test Credentials

### User Account (for making test payments)
Use any of these eSewa IDs to make test payments:

- **eSewa ID**: 9806800001, 9806800002, 9806800003, 9806800004, or 9806800005
- **Password**: Nepal@123
- **MPIN**: 1122
- **Token**: 123456

### Merchant Credentials (already configured)
These are used by the backend to process payments:

- **Merchant ID**: EPAYTEST
- **Secret Key**: 8gBm/:&EnhH.1/q

## 🚀 Quick Test Steps

### Step 1: Update Your .env.local

Make sure your `.env.local` has these values:

```env
# eSewa Test Configuration
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q
ESEWA_SUCCESS_URL=http://localhost:3000/api/payment/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/api/payment/esewa/failure

# Other required variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
```

### Step 2: Run the Migration

If not done already:
1. Go to Supabase Dashboard → SQL Editor
2. Paste content from `supabase/migrations/003_create_payments_table.sql`
3. Execute the migration

### Step 3: Start the Application

```bash
npm run dev
```

Application will start at http://localhost:3000

### Step 4: Make a Test Booking

1. **Go to Chat**: http://localhost:3000/chat
2. **Start conversation**: "I want to book a movie ticket"
3. **Follow the wizard**:
   - Select a movie
   - Choose date and time
   - Select number of seats
   - Pick your seats
   - Fill passenger details
   - Proceed to payment

### Step 5: Test eSewa Payment

1. **Select eSewa** as payment method
2. **Click "Proceed to Payment"**
3. **You'll be redirected** to eSewa sandbox (https://uat.esewa.com.np/)
4. **Login with test credentials**:
   - eSewa ID: `9806800001` (or any from the list)
   - Password: `Nepal@123`
   - MPIN: `1122`
5. **Complete payment** on eSewa page
6. **You'll be redirected back** to success page
7. **Check booking status** - Should be "Confirmed"

### Step 6: Verify in Database

Check Supabase:

```sql
-- View recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- View recent bookings
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;

-- Check payment status for specific booking
SELECT
    b.id as booking_id,
    b.status as booking_status,
    p.gateway,
    p.status as payment_status,
    p.amount,
    p.transaction_id,
    p.created_at
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
ORDER BY b.created_at DESC
LIMIT 10;
```

## 🧪 Test Scenarios

### ✅ Scenario 1: Successful Payment

**Steps:**
1. Complete booking flow
2. Select eSewa
3. Complete payment with test credentials
4. Verify redirect to success page

**Expected Results:**
- ✅ Booking status: "Confirmed"
- ✅ Payment status: "success"
- ✅ Transaction ID saved
- ✅ Success page shows booking details

### ❌ Scenario 2: Failed/Cancelled Payment

**Steps:**
1. Complete booking flow
2. Select eSewa
3. On eSewa page, click "Cancel" or close the window
4. Verify redirect to failure page

**Expected Results:**
- ✅ Booking status: "Payment Failed"
- ✅ Payment status: "failed"
- ✅ Failure page shows error message
- ✅ User can retry

### 💵 Scenario 3: Cash Payment

**Steps:**
1. Complete booking flow
2. Select "Pay at Counter"
3. Click "Confirm Reservation"

**Expected Results:**
- ✅ Booking status: "Confirmed"
- ✅ No payment record created (or status: "pending")
- ✅ Confirmation page shows "Pay at counter" message

### 🔄 Scenario 4: Multiple Bookings

**Steps:**
1. Make multiple bookings with different payment methods
2. Check admin panel: http://localhost:3000/admin/verify
3. Verify all bookings appear correctly

**Expected Results:**
- ✅ All bookings listed
- ✅ Correct payment methods shown
- ✅ Statuses accurate

## 🐛 Troubleshooting

### Issue: "Payment initiation failed"

**Possible Causes:**
- Missing environment variables
- Database connection issues
- Invalid booking data

**Solution:**
```bash
# Check env variables
echo $ESEWA_MERCHANT_CODE
echo $ESEWA_SECRET_KEY

# Check database connection
curl http://localhost:3000/api/test-db

# Check browser console for errors
```

### Issue: eSewa redirect not working

**Possible Causes:**
- Incorrect callback URLs
- Form submission error
- Network issues

**Solution:**
1. Check browser console for errors
2. Verify callback URLs match in .env.local
3. Check that PORT 3000 is accessible
4. Try clearing browser cache

### Issue: Callback not received

**Possible Causes:**
- Localhost not accessible from internet
- Wrong callback URL
- eSewa can't reach localhost

**Solution:**
For local testing, eSewa sandbox might not be able to call localhost. Options:
1. Use ngrok to expose localhost: `ngrok http 3000`
2. Update callback URLs to ngrok URL
3. OR manually test callback by visiting:
   ```
   http://localhost:3000/api/payment/esewa/success?oid=BK-XXX&amt=800&refId=TEST123
   ```

### Issue: Payment verification fails

**Possible Causes:**
- Wrong secret key
- Amount mismatch
- Invalid transaction ID

**Solution:**
1. Verify secret key: `8gBm/:&EnhH.1/q`
2. Check server logs for verification errors
3. Ensure amounts match exactly (no rounding)

## 📊 Testing Checklist

Before considering payment integration complete, test:

- [ ] **eSewa successful payment** - Full flow works
- [ ] **eSewa failed payment** - Proper error handling
- [ ] **eSewa cancelled payment** - User can cancel
- [ ] **Cash payment** - Direct confirmation
- [ ] **Database records** - Payments and bookings created
- [ ] **Success page** - Shows correct details
- [ ] **Failure page** - Shows error message
- [ ] **Admin panel** - Bookings appear correctly
- [ ] **Multiple bookings** - Can make several in a row
- [ ] **Different amounts** - Small and large payments
- [ ] **Mobile view** - Responsive on mobile
- [ ] **Error recovery** - Can retry after failure

## 🔍 Debug Logging

Enable detailed logging to track payment flow:

```typescript
// In lib/services/payment-service.ts
console.log('[eSewa] Initiating payment:', request);
console.log('[eSewa] Form data:', formData);
console.log('[eSewa] Verification request:', verifyParams);
console.log('[eSewa] Verification response:', xmlText);
```

Check browser console and terminal for these logs.

## 📱 Testing on Mobile

### Option 1: Local Network
```bash
# Find your local IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# Access from phone
http://192.168.x.x:3000/chat
```

### Option 2: ngrok Tunnel
```bash
# Install ngrok
npm install -g ngrok

# Create tunnel
ngrok http 3000

# Use ngrok URL
https://xxxx-xxx-xxx.ngrok.io

# Update callback URLs to use ngrok URL
```

## 🎯 Production Testing

Once sandbox testing passes:

1. **Get production credentials** from eSewa
2. **Update environment variables** with production keys
3. **Set NODE_ENV=production**
4. **Update callback URLs** to production domain
5. **Test with small real amount** (NPR 10-50)
6. **Verify transaction** in eSewa merchant dashboard
7. **Check money received** in merchant account
8. **Test refund** if supported

## 💡 Testing Tips

1. **Test edge cases**:
   - Very small amounts (NPR 1)
   - Large amounts (NPR 10,000+)
   - Decimal amounts (NPR 150.50)

2. **Test different browsers**:
   - Chrome
   - Firefox
   - Safari
   - Mobile browsers

3. **Test slow connections**:
   - Use Chrome DevTools → Network → Slow 3G
   - Verify loading states work

4. **Test concurrent bookings**:
   - Open multiple browser tabs
   - Try booking same seats simultaneously
   - Verify seat locking works

5. **Test payment timeout**:
   - Start payment, wait long time
   - Try to complete - should fail gracefully

## 📞 Support

If you encounter issues:

1. **Check server logs**: Look for [eSewa] or [Payment API] prefixed logs
2. **Check browser console**: JavaScript errors
3. **Check database**: Verify records created
4. **Check network tab**: Failed requests
5. **Check eSewa docs**: https://developer.esewa.com.np/

## ✅ Test Complete Indicator

You're ready for production when:

✅ All test scenarios pass
✅ No console errors
✅ Database records correct
✅ Payment verification works
✅ Success/failure pages work
✅ Admin panel shows bookings
✅ Mobile view tested
✅ Error handling verified

Happy testing! 🎉
