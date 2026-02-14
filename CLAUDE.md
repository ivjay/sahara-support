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

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OLLAMA_BASE_URL=http://127.0.0.1:11434  # Optional, defaults to localhost
OLLAMA_MODEL=llama3.2:latest            # Optional, defaults to llama3.2:latest
```

## Database Setup

### Supabase Tables Required:

1. **conversations** - Stores chat conversation history
2. **bookings** - Stores confirmed bookings with verification status
3. **services** - Stores admin-created services (NEW!)

### Creating the Services Table:

Run the SQL migration in your Supabase SQL Editor:

```bash
# File location: supabase_migration_services.sql
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Copy contents of supabase_migration_services.sql
# 3. Paste and click "Run"
```

The migration creates:
- `services` table with proper schema
- Indexes for fast queries (type, category, available)
- Row Level Security policies
- Auto-updating `updated_at` trigger

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

### Payment Flow
1. User selects service → Agent shows payment options (QR + Cash)
2. QR payment → Shows QR code, waits for "I have paid"
3. Cash payment → Confirms reservation, no upfront payment
4. Verification → Admin verifies in `/admin/verify` page
5. Completion → Receipt generated with booking details

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

- `app/api/bookings/route.ts` - Fetch all bookings from file-based DB
- `app/api/test-db/route.ts` - Health check for Supabase connection

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

**Payment verification stuck:**
- Specific keywords: "I have paid", "payment done", "paid gareko", "payment garisakeko"
- Must have `currentBooking` with valid intent
- Sets `verificationPending: "true"` and `paymentSubmittedAt` timestamp
- Booking created with status "Under Review"
- Admin verifies at `/admin/verify`
- Smart polling (5s interval) only when pending verifications exist

**Performance optimizations:**
- System prompt reduced from 280 lines to ~50 lines (5x faster)
- Polling changed from 300ms to 5000ms (16x less frequent)
- Only polls when there are pending verifications
- Reduced retries from 3 to 1 attempt
- Timeout reduced from 60s to 30s
