# Prompt 03: Chat Types and Mock Data

## Objective
Create TypeScript type definitions and mock data for the chat system. This establishes the data structure for messages, intents, and booking options.

---

## Files to Create

| File | Purpose |
|------|---------|
| `lib/chat/types.ts` | TypeScript interfaces and types |
| `lib/chat/mock-data.ts` | Sample responses and booking options |

---

## Step 1: Create lib/chat/types.ts

```typescript
// Message roles
export type MessageRole = "user" | "assistant" | "system";

// User intents the agent can detect
export type Intent =
  | "GREETING"
  | "BUS_BOOKING"
  | "FLIGHT_BOOKING"
  | "APPOINTMENT"
  | "MOVIE_BOOKING"
  | "GENERAL_QUERY"
  | "UNKNOWN";

// Individual chat message
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  intent?: Intent;
  options?: BookingOption[];
  quickReplies?: string[];
}

// Booking option card displayed to user
export interface BookingOption {
  id: string;
  type: "bus" | "flight" | "appointment" | "movie";
  title: string;
  subtitle: string;
  price?: number;
  currency?: string;
  details: Record<string, string>;
  available: boolean;
}

// Booking flow state
export interface BookingState {
  intent: Intent;
  step: number;
  collectedData: Record<string, string>;
  requiredFields: string[];
  isComplete: boolean;
}

// Chat context state
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentBooking: BookingState | null;
  userId: string;
}

// Action types for chat reducer
export type ChatAction =
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_BOOKING"; payload: BookingState | null }
  | { type: "CLEAR_CHAT" }
  | { type: "UPDATE_BOOKING_DATA"; payload: Record<string, string> };

// Required fields per intent
export const INTENT_REQUIRED_FIELDS: Record<Intent, string[]> = {
  GREETING: [],
  BUS_BOOKING: ["from", "to", "date", "passengers"],
  FLIGHT_BOOKING: ["from", "to", "departDate", "passengers", "class"],
  APPOINTMENT: ["type", "specialist", "date", "time"],
  MOVIE_BOOKING: ["movie", "theater", "date", "time", "seats"],
  GENERAL_QUERY: [],
  UNKNOWN: [],
};

// Questions to ask for each field
export const FIELD_QUESTIONS: Record<string, string> = {
  from: "Where would you like to travel from?",
  to: "Where would you like to go?",
  date: "What date works for you?",
  departDate: "When do you want to depart?",
  passengers: "How many passengers?",
  class: "Which class do you prefer? (Economy, Business, First)",
  type: "What type of appointment do you need?",
  specialist: "Do you have a preferred doctor or specialist?",
  time: "What time works best for you?",
  movie: "Which movie would you like to watch?",
  theater: "Which theater or cinema?",
  seats: "How many seats do you need?",
};
```

---

## Step 2: Create lib/chat/mock-data.ts

```typescript
import { BookingOption, Intent } from "./types";

// Welcome message
export const WELCOME_MESSAGE = `Hi! 👋 I'm Sahara, your support assistant.

I can help you with:
• 🚌 Bus ticket booking
• ✈️ Flight reservations
• 🏥 Doctor appointments
• 🎬 Movie tickets

How can I help you today?`;

// Quick action suggestions
export const QUICK_ACTIONS = [
  "Book a bus ticket",
  "Find flights",
  "Schedule an appointment",
  "Book movie tickets",
];

// Intent detection keywords
export const INTENT_KEYWORDS: Record<Intent, string[]> = {
  GREETING: ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
  BUS_BOOKING: ["bus", "bus ticket", "travel by bus", "book bus"],
  FLIGHT_BOOKING: ["flight", "fly", "airplane", "air ticket", "book flight"],
  APPOINTMENT: ["appointment", "doctor", "hospital", "clinic", "checkup", "medical"],
  MOVIE_BOOKING: ["movie", "cinema", "film", "theater", "show", "watch movie"],
  GENERAL_QUERY: ["help", "what can you do", "services", "options"],
  UNKNOWN: [],
};

// Mock bus options
export const MOCK_BUS_OPTIONS: BookingOption[] = [
  {
    id: "bus-1",
    type: "bus",
    title: "Deluxe Express",
    subtitle: "Kathmandu → Pokhara",
    price: 1200,
    currency: "NPR",
    details: {
      departure: "6:00 AM",
      arrival: "1:00 PM",
      duration: "7 hours",
      busType: "AC Deluxe",
      seats: "12 available",
    },
    available: true,
  },
  {
    id: "bus-2",
    type: "bus",
    title: "Tourist Coach",
    subtitle: "Kathmandu → Pokhara",
    price: 1500,
    currency: "NPR",
    details: {
      departure: "7:30 AM",
      arrival: "2:00 PM",
      duration: "6.5 hours",
      busType: "Tourist Deluxe",
      seats: "8 available",
    },
    available: true,
  },
  {
    id: "bus-3",
    type: "bus",
    title: "Night Sleeper",
    subtitle: "Kathmandu → Pokhara",
    price: 1800,
    currency: "NPR",
    details: {
      departure: "8:00 PM",
      arrival: "4:00 AM",
      duration: "8 hours",
      busType: "Sleeper Bus",
      seats: "5 available",
    },
    available: true,
  },
];

// Mock flight options
export const MOCK_FLIGHT_OPTIONS: BookingOption[] = [
  {
    id: "flight-1",
    type: "flight",
    title: "Buddha Air",
    subtitle: "Kathmandu → Pokhara",
    price: 4500,
    currency: "NPR",
    details: {
      departure: "8:00 AM",
      arrival: "8:25 AM",
      duration: "25 min",
      aircraft: "ATR 72-500",
      class: "Economy",
    },
    available: true,
  },
  {
    id: "flight-2",
    type: "flight",
    title: "Yeti Airlines",
    subtitle: "Kathmandu → Pokhara",
    price: 4200,
    currency: "NPR",
    details: {
      departure: "10:30 AM",
      arrival: "10:55 AM",
      duration: "25 min",
      aircraft: "Jetstream 41",
      class: "Economy",
    },
    available: true,
  },
];

// Mock appointment options
export const MOCK_APPOINTMENT_OPTIONS: BookingOption[] = [
  {
    id: "apt-1",
    type: "appointment",
    title: "Dr. Sharma",
    subtitle: "General Physician",
    price: 500,
    currency: "NPR",
    details: {
      hospital: "City Hospital",
      experience: "15 years",
      availability: "Mon-Fri",
      nextSlot: "Tomorrow 10:00 AM",
    },
    available: true,
  },
  {
    id: "apt-2",
    type: "appointment",
    title: "Dr. Thapa",
    subtitle: "Cardiologist",
    price: 1500,
    currency: "NPR",
    details: {
      hospital: "Heart Care Center",
      experience: "20 years",
      availability: "Tue, Thu, Sat",
      nextSlot: "Thursday 2:00 PM",
    },
    available: true,
  },
];

// Mock movie options
export const MOCK_MOVIE_OPTIONS: BookingOption[] = [
  {
    id: "movie-1",
    type: "movie",
    title: "Kabaddi 5",
    subtitle: "QFX Cinemas, Labim Mall",
    price: 400,
    currency: "NPR",
    details: {
      showtime: "4:30 PM",
      language: "Nepali",
      format: "2D",
      rating: "⭐ 4.5/5",
    },
    available: true,
  },
  {
    id: "movie-2",
    type: "movie",
    title: "Avengers: Secret Wars",
    subtitle: "Big Movies, Civil Mall",
    price: 600,
    currency: "NPR",
    details: {
      showtime: "7:00 PM",
      language: "English",
      format: "3D IMAX",
      rating: "⭐ 4.8/5",
    },
    available: true,
  },
];

// Response templates
export const RESPONSE_TEMPLATES = {
  GREETING: "Hello! How can I assist you today?",
  BUS_BOOKING_START: "I'd be happy to help you book a bus ticket! Let me ask a few questions.",
  FLIGHT_BOOKING_START: "Great! Let's find you the perfect flight. I'll need some details.",
  APPOINTMENT_START: "I can help you schedule an appointment. Let me gather some information.",
  MOVIE_BOOKING_START: "Let's get you some movie tickets! I just need a few details.",
  OPTIONS_FOUND: "Here are the available options I found for you:",
  NO_OPTIONS: "I couldn't find any options matching your criteria. Would you like to try different dates or preferences?",
  BOOKING_COMPLETE: "Great choice! I've noted your selection. Would you like to proceed with the booking?",
  UNKNOWN: "I'm not sure I understood that. Could you please rephrase or choose from the options I can help with?",
};
```

---

## File Structure After This Step

```
lib/
└── chat/
    ├── types.ts      ✓
    └── mock-data.ts  ✓
```

---

## Verification

1. Check that TypeScript compiles without errors:
   ```powershell
   npx tsc --noEmit
   ```

2. Verify imports work by adding this test in any file:
   ```typescript
   import { Message, Intent } from "@/lib/chat/types";
   import { MOCK_BUS_OPTIONS } from "@/lib/chat/mock-data";
   ```

---

## Important Notes

> 📝 This creates the **data foundation** - no UI changes yet
> 📝 The mock data uses Nepal-relevant examples (cities, currency)
> 📝 All types are properly exported for use in other files

---

## Next Step

→ Proceed to **Prompt 04: Chat Context**
