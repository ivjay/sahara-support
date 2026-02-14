# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sahara Support System is a Next.js application that provides an AI-powered booking system for various services (bus, flight, doctor appointments, movies) using a conversational interface. It uses:

- **Next.js 16** with App Router and React Server Components
- **Ollama** for local LLM inference (llama3.2:latest by default)
- **Supabase** for conversation and booking persistence
- **File-based JSON** as a fallback database (data/bookings.json)
- **TypeScript** with strict mode enabled

## Development Commands

```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Ollama (Optional, defaults to localhost)
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:latest

# eSewa Payment Gateway (Required for payments)
ESEWA_MERCHANT_CODE=EPAYTEST  # Test: EPAYTEST, Production: your_merchant_code
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q  # Test key provided
ESEWA_SUCCESS_URL=http://localhost:3000/api/payment/esewa/success
ESEWA_FAILURE_URL=http://localhost:3000/api/payment/esewa/failure

# Khalti Payment Gateway (Optional)
KHALTI_PUBLIC_KEY=your_public_key
KHALTI_SECRET_KEY=your_secret_key
KHALTI_RETURN_URL=http://localhost:3000/api/payment/khalti/callback

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development  # Use 'production' for live payments
```

### Test Credentials (eSewa Sandbox)
**For making test payments:**
- eSewa ID: 9806800001, 9806800002, 9806800003, 9806800004, or 9806800005
- Password: Nepal@123
- MPIN: 1122
- Token: 123456

**Note:** Test credentials only work when `NODE_ENV=development` (sandbox mode)

## Database Setup

### Supabase Tables Required:

1. **conversations** - Stores chat conversation history
2. **bookings** - Stores confirmed bookings with verification status
3. **services** - Stores admin-created services
4. **payments** - Stores payment transaction records (NEW!)
5. **venues** - Stores seat maps for movies, buses, flights
6. **seat_inventory** - Tracks real-time seat availability

### Running Database Migrations:

Run migrations in order in your Supabase SQL Editor:

```bash
# 1. Initial schema (conversations, bookings, services)
supabase/migrations/001_initial_schema.sql

# 2. Seat layouts for venues
supabase/migrations/002_update_seat_layouts.sql

# 3. Payment system (NEW!)
supabase/migrations/003_create_payments_table.sql
```

**Migration 003 creates:**
- `payments` table with payment transaction tracking
- Indexes for booking_id, transaction_id, status, gateway
- Auto-updating `updated_at` trigger
- Foreign key relationship: `bookings.payment_id → payments.id`
- Support for multiple gateways: eSewa, Khalti, ConnectIPS, Cash

### First-Time Setup:

On first load, the app automatically seeds the database with mock data from:
- `MOCK_BUS_OPTIONS`
- `MOCK_FLIGHT_OPTIONS`
- `MOCK_APPOINTMENT_OPTIONS`
- `MOCK_MOVIE_OPTIONS`

This happens in `lib/services/service-context.tsx:seedDatabase()`

## Architecture

### Core Components

**Chat Agent System** (`lib/chat/agent.ts`)
- `processMessage()`: Main message processing pipeline that:
  1. Intercepts hardcoded payment verification keywords
  2. Calls Ollama LLM for AI response via `getAgentResponse()`
  3. Maps booking types to showOptions intent
  4. Extracts specialty/category from AI content
  5. Fetches filtered options using `getOptionsByType()`
  6. Returns response with content, options, and updated booking state

- `handleOptionSelection()`: Processes user selection of booking options:
  - Payment method selection (QR code vs cash)
  - Booking confirmation flow
  - Generates dynamic payment options with pricing

**Intent Extraction** (`lib/integrations/intent-extractor.ts`)
- Uses Ollama to extract structured intent from Nepanglish/English messages
- Includes fallback keyword matching when LLM fails
- Returns intent, extracted data, confidence, and missing fields

**Ollama Integration** (`lib/integrations/ollama-service.ts`)
- Uses legacy Node.js `http` module (workaround for Node.js 22 fetch issues)
- Implements retry logic with exponential backoff (3 attempts)
- 60-second timeout for local LLM inference
- `extractJSON()` helper handles markdown code blocks and plain JSON

**Booking Options** (`lib/chat/option-helper.ts`)
- Centralizes filtering logic for all service types
- Supports category-based filtering (specialty, movie name, etc.)
- Merges mock data with admin-created services from Supabase

**Database Abstraction** (`lib/db/service.ts`)
- File-based JSON storage with atomic operations
- Automatic corruption detection and recovery
- Implements BookingRepository interface
- Used when Supabase is unavailable or for local development

**Supabase Client** (`lib/supabase.ts`)
- `saveConversation()`: Upserts conversation with messages and stage
- `createBooking()`: Inserts new bookings with status tracking
- `updateBookingStatus()`: Updates booking verification status
- `checkSupabaseConnection()`: Health check for database connectivity

**Payment Service** (`lib/services/payment-service.ts`)
- `PaymentService.initiatePayment()`: Initiates payment with selected gateway
- `PaymentService.verifyPayment()`: Verifies payment after gateway callback
- `ESewaPaymentService`: eSewa integration with form submission
- `KhaltiPaymentService`: Khalti integration with direct API calls
- Automatic sandbox/production switching based on NODE_ENV

### Data Flow

1. **User Message** → `app/actions/chat.ts:sendMessage()` (Server Action)
2. **Process Message** → `lib/chat/agent.ts:processMessage()`
   - Calls Ollama via `getAgentResponse()`
   - Uses `SAHARA_SYSTEM_PROMPT` for context
   - Parses structured response with `parseBookingResponse()`
3. **Option Filtering** → `lib/chat/option-helper.ts:getOptionsByType()`
   - Filters by intent type (BUS_BOOKING, APPOINTMENT, etc.)
   - Applies category filters (specialty, movie, etc.)
4. **State Update** → Returns `AgentResponse` with:
   - `content`: AI-generated message
   - `options`: Filtered booking options
   - `quickReplies`: Suggested responses
   - `newBookingState`: Updated booking context
5. **Persistence**:
   - Conversation saved to Supabase (`conversations` table)
   - Completed bookings saved to Supabase (`bookings` table)
   - Fallback to file-based storage if Supabase fails

### Key Type Definitions

**BookingOption** (`lib/chat/types.ts`)
```typescript
interface BookingOption {
  id: string;
  type: "bus" | "flight" | "appointment" | "movie" | "payment_qr" | "payment_cash";
  category?: string;  // doctor specialty, movie name, etc.
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  details: Record<string, string>;  // CRITICAL: All values must be strings
  available: boolean;
  qrCodeUrl?: string;
}
```

**BookingState** (`lib/chat/types.ts`)
```typescript
interface BookingState {
  intent: Intent;
  step: number;
  collectedData: Record<string, string>;
  requiredFields: string[];
  isComplete: boolean;
}
```

### Admin Panel

Located in `app/admin/` - allows creating and managing:
- Doctor appointments (specialties, hospitals, slots)
- Movie tickets (theaters, showtimes)
- Transport options (bus/flight routes)

**Service Storage:**
- Admin-created services are stored in Supabase `services` table
- `lib/services/service-context.tsx` manages service CRUD operations
- All operations are async and use Supabase client
- Services are automatically merged with mock data and shown in chat
- Soft deletes (sets `available = false` instead of hard delete)

**Database Schema (services table):**
- `id`: Unique service identifier
- `type`: Service type (appointment, bus, flight, movie)
- `category`: Category/specialty (e.g., pediatrician, psychologist)
- `title`: Service name
- `subtitle`: Brief description
- `price`: Price in specified currency
- `currency`: Currency code (default: NPR)
- `details`: JSONB field for service-specific data (hospital, phone, etc.)
- `available`: Boolean for soft deletes
- `qrCodeUrl`: Optional QR code for payments
- `created_at`, `updated_at`: Timestamps

**Database Schema (payments table - NEW!):**
- `id`: UUID primary key
- `booking_id`: Reference to booking (TEXT, indexed)
- `gateway`: Payment method used ('esewa', 'khalti', 'connectips', 'cash')
- `amount`: Payment amount (DECIMAL 10,2)
- `currency`: Currency code (default: 'NPR')
- `status`: Payment status ('pending', 'success', 'failed', 'refunded')
- `transaction_id`: Unique transaction ID from gateway (UNIQUE constraint)
- `gateway_response`: Full gateway response (JSONB)
- `payment_url`: Payment URL from gateway
- `initiated_at`: When payment was initiated
- `completed_at`: When payment was completed/failed
- `created_at`, `updated_at`: Timestamps with auto-update trigger

### Mock Data

`lib/chat/mock-data.ts` contains hardcoded options for:
- `MOCK_BUS_OPTIONS`: Bus routes with departure times
- `MOCK_FLIGHT_OPTIONS`: Flight destinations
- `MOCK_APPOINTMENT_OPTIONS`: Doctors by specialty
- `MOCK_MOVIE_OPTIONS`: Movie showtimes

These are filtered by the agent based on user intent and category.

## Important Patterns

### Server Actions
All chat interactions use Next.js Server Actions (marked with `"use server"`):
- `app/actions/chat.ts:sendMessage()` - Main chat endpoint
- `app/actions/chat.ts:getAgentResponse()` - Ollama LLM call

### Ollama System Prompt
`lib/chat/sahara-prompt.ts` contains `SAHARA_SYSTEM_PROMPT` which instructs the LLM to:
- Respond in Nepanglish (Nepali + English mix)
- Extract booking details from conversation
- Return structured JSON with stage, language, booking_type, collected_details

### Payment Flow (UPDATED - Real Integration)

**Chat Flow (Legacy):**
1. User selects service → Agent shows payment options (QR + Cash)
2. QR payment → Shows mock QR code, waits for "I have paid"
3. Cash payment → Confirms reservation immediately
4. Admin verification → Manual approval at `/admin/verify`

**Wizard Flow (Real Payments):**
1. User completes booking wizard (service → date → seats → details)
2. **Payment Step** shows 3 options:
   - **eSewa** (Digital Wallet) - Instant verification
   - **Khalti** (Digital Wallet) - Instant verification
   - **Cash at Counter** - Pay on arrival

**eSewa Payment Flow:**
```
1. User selects eSewa
2. Frontend: POST /api/payment/initiate
   - Creates booking (status: "Pending Payment")
   - Creates payment record (status: "pending")
   - Returns eSewa payment form data
3. Frontend: Auto-submits form → redirects to eSewa sandbox/production
4. User logs in to eSewa: ID: 9806800001, Password: Nepal@123, MPIN: 1122
5. User completes payment on eSewa
6. eSewa redirects to: GET /api/payment/esewa/success?oid=BK-XXX&amt=800&refId=TXN123
7. Backend verifies payment with eSewa API
8. Updates payment status → "success"
9. Updates booking status → "Confirmed"
10. Redirects user to /payment/success page
11. Shows receipt with transaction ID
```

**Khalti Payment Flow:**
```
1. User selects Khalti
2. Frontend: POST /api/payment/initiate
3. Backend calls Khalti API → returns payment URL
4. Redirects user to Khalti payment page
5. User completes payment
6. Khalti redirects to: GET /api/payment/khalti/callback?pidx=XXX
7. Backend verifies with Khalti lookup API
8. Updates booking and payment status
9. Shows success page
```

**Cash Payment Flow:**
```
1. User selects "Pay at Counter"
2. Booking created immediately (status: "Confirmed")
3. No payment gateway involved
4. User pays on arrival
```

### Booking Verification
`app/admin/verify/page.tsx` shows bookings with `status: "Under Review"` where admin can:
- View booking details
- Approve (status → "confirmed")
- Reject (status → "rejected")

### Path Aliases
`@/` maps to project root (configured in tsconfig.json):
```typescript
import { processMessage } from "@/lib/chat/agent";
```

## API Routes

### Booking APIs
- `app/api/bookings/route.ts` - GET: Fetch bookings, POST: Create booking
- `app/api/test-db/route.ts` - Health check for Supabase connection
- `app/api/seats/route.ts` - Fetch seat availability for venue/service/date
- `app/api/time-slots/route.ts` - Get available time slots for services

### Payment APIs (NEW!)
- `app/api/payment/initiate/route.ts` - POST: Initiate payment with gateway
  - Creates payment record in database
  - Calls gateway API (eSewa/Khalti)
  - Returns payment URL or form data

- `app/api/payment/esewa/success/route.ts` - GET: eSewa success callback
  - Receives: oid (booking ID), amt (amount), refId (transaction ID)
  - Verifies payment with eSewa API
  - Updates payment and booking status
  - Redirects to /payment/success

- `app/api/payment/esewa/failure/route.ts` - GET: eSewa failure callback
  - Updates payment status to "failed"
  - Redirects to /payment/failed

- `app/api/payment/khalti/callback/route.ts` - GET: Khalti callback
  - Receives: pidx, transaction_id, status
  - Verifies with Khalti lookup API
  - Updates statuses and redirects

## Debugging

Ollama logs are prefixed with `[Ollama]`:
- `✓` indicates success
- `✗` indicates failure
- Watch for timeout errors (60s limit)

Agent logs use `[Agent]` and `[Chat]` prefixes.

Supabase logs use `[Supabase]` prefix with status indicators.

## Troubleshooting

**Ollama not responding:**
- Check if Ollama is running: `ollama list`
- Verify model is downloaded: `ollama pull llama3.2`
- Check base URL matches OLLAMA_BASE_URL env var

**Supabase errors:**
- Verify environment variables are set
- Check table structure matches expected schema (conversations, bookings)
- Use `/api/test-db` to test connection

**Payment issues:**
- **Legacy chat flow**: Uses keywords "I have paid" for manual verification
- **Wizard flow**: Automatic verification via gateway callbacks
- **eSewa not redirecting**: Check ESEWA_SECRET_KEY and callback URLs
- **Khalti verification fails**: Verify KHALTI_SECRET_KEY is correct
- **Payment stuck as pending**:
  - Check if callback URL is accessible (may need ngrok for localhost)
  - Manually test callback: `http://localhost:3000/api/payment/esewa/success?oid=BK-XXX&amt=800&refId=TEST`
- **Amount mismatch errors**: Ensure amounts match exactly (no rounding issues)
- **Transaction already exists**: Check `transaction_id` uniqueness, may be duplicate callback

**Payment testing:**
- Always use test credentials in development
- Sandbox URLs used automatically when NODE_ENV=development
- Production credentials required when NODE_ENV=production
- Test small amounts first (NPR 10-50) in production

**Performance optimizations:**
- System prompt reduced from 280 lines to ~50 lines (5x faster)
- Polling changed from 300ms to 5000ms (16x less frequent)
- Only polls when there are pending verifications
- Reduced retries from 3 to 1 attempt
- Timeout reduced from 60s to 30s

## Payment Integration

### Supported Payment Gateways

1. **eSewa** (Primary) - Most popular in Nepal
   - Sandbox: https://uat.esewa.com.np/
   - Production: https://esewa.com.np/
   - Integration: Form submission with auto-redirect
   - Verification: XML API response parsing

2. **Khalti** (Secondary) - Second most popular
   - Sandbox: https://a.khalti.com/
   - Production: https://khalti.com/
   - Integration: REST API with payment URL
   - Verification: JSON lookup API

3. **Cash on Counter** - No gateway, immediate confirmation

### Payment Security

- **Signature Verification**: All gateway responses verified with secret keys
- **Idempotency**: Transaction IDs checked for uniqueness to prevent double-charging
- **Amount Validation**: Payment amount matched against booking before confirmation
- **HTTPS Only**: Callbacks must use HTTPS in production
- **No Frontend Secrets**: Secret keys never exposed to client
- **Gateway Response Logging**: Full responses stored in `gateway_response` JSONB field

### Payment Monitoring

**Check payment status:**
```sql
-- View recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- Check specific booking payment
SELECT
    b.id, b.status as booking_status,
    p.gateway, p.status as payment_status,
    p.amount, p.transaction_id
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.id = 'BK-XXXXX';

-- Failed payments today
SELECT * FROM payments
WHERE status = 'failed'
AND DATE(created_at) = CURRENT_DATE;
```

**Payment success rate:**
```sql
SELECT
    gateway,
    COUNT(*) FILTER (WHERE status = 'success') as successful,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM payments
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY gateway;
```

### Testing Payments

See `docs/TESTING_GUIDE.md` for comprehensive testing instructions.

**Quick test:**
1. Run migration: `003_create_payments_table.sql`
2. Update `.env.local` with test credentials
3. Start dev server: `npm run dev`
4. Make booking via wizard
5. Select eSewa payment
6. Login with test ID: 9806800001
7. Complete payment in sandbox
8. Verify redirect to success page
9. Check database for payment record

### Production Deployment

**Before going live:**
- [ ] Get production credentials from eSewa and Khalti
- [ ] Update environment variables with production keys
- [ ] Set `NODE_ENV=production`
- [ ] Update callback URLs to production domain
- [ ] Register callback URLs with payment gateways
- [ ] Test with small real amount (NPR 10-50)
- [ ] Monitor first few transactions closely
- [ ] Set up payment failure alerts

**Production URLs:**
- eSewa Success: `https://yourdomain.com/api/payment/esewa/success`
- eSewa Failure: `https://yourdomain.com/api/payment/esewa/failure`
- Khalti Callback: `https://yourdomain.com/api/payment/khalti/callback`

### Payment Gateway Fees

- **eSewa**: ~1.5-2% per transaction + NPR 10 fee
- **Khalti**: ~2-2.5% per transaction

Consider fee handling strategy:
1. Absorb in pricing (reduce margin)
2. Pass to customer (add to total)
3. Add transparent service charge

### Files Reference

**Payment Integration Files:**
- `lib/services/payment-service.ts` - Payment gateway integration
- `app/api/payment/initiate/route.ts` - Payment initiation
- `app/api/payment/esewa/success/route.ts` - eSewa success callback
- `app/api/payment/esewa/failure/route.ts` - eSewa failure callback
- `app/api/payment/khalti/callback/route.ts` - Khalti callback
- `components/booking/steps/PaymentStep.tsx` - Payment UI
- `app/payment/success/page.tsx` - Success page
- `app/payment/failed/page.tsx` - Failure page
- `supabase/migrations/003_create_payments_table.sql` - Database migration
- `docs/TESTING_GUIDE.md` - Testing instructions
- `docs/SETUP.md` - Setup guide
- `docs/PAYMENT_INTEGRATION_PLAN.md` - Integration roadmap
