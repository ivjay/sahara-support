# Prompt 07: Agentic Response Logic

## Objective
Create the mock agent logic that detects user intent, asks clarifying questions, and returns booking options. This simulates the AI backend behavior.

---

## Files to Create

| File | Purpose |
|------|---------|
| `lib/chat/agent.ts` | Main agent logic and response generation |

---

## Step 1: Create lib/chat/agent.ts

```typescript
import {
  Intent,
  BookingState,
  BookingOption,
  Message,
  INTENT_REQUIRED_FIELDS,
  FIELD_QUESTIONS,
} from "./types";
import {
  INTENT_KEYWORDS,
  MOCK_BUS_OPTIONS,
  MOCK_FLIGHT_OPTIONS,
  MOCK_APPOINTMENT_OPTIONS,
  MOCK_MOVIE_OPTIONS,
  RESPONSE_TEMPLATES,
  WELCOME_MESSAGE,
} from "./mock-data";
import { delay, generateId } from "./utils";

// Detect user intent from message
export function detectIntent(message: string): Intent {
  const lowerMessage = message.toLowerCase();

  // Check each intent's keywords
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "UNKNOWN") continue;
    
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return intent as Intent;
      }
    }
  }

  return "UNKNOWN";
}

// Extract data from user message based on current booking context
export function extractData(
  message: string,
  currentField: string
): Record<string, string> {
  // Simple extraction - in real app, this would use NLP
  const extracted: Record<string, string> = {};
  
  // Store the raw message as the field value for now
  extracted[currentField] = message.trim();
  
  return extracted;
}

// Get the next question to ask based on booking state
export function getNextQuestion(bookingState: BookingState): string | null {
  const { collectedData, requiredFields } = bookingState;
  
  for (const field of requiredFields) {
    if (!collectedData[field]) {
      return FIELD_QUESTIONS[field] || `What is your ${field}?`;
    }
  }
  
  return null; // All fields collected
}

// Get mock options based on intent
function getMockOptions(intent: Intent): BookingOption[] {
  switch (intent) {
    case "BUS_BOOKING":
      return MOCK_BUS_OPTIONS;
    case "FLIGHT_BOOKING":
      return MOCK_FLIGHT_OPTIONS;
    case "APPOINTMENT":
      return MOCK_APPOINTMENT_OPTIONS;
    case "MOVIE_BOOKING":
      return MOCK_MOVIE_OPTIONS;
    default:
      return [];
  }
}

// Create initial booking state for an intent
export function createBookingState(intent: Intent): BookingState {
  return {
    intent,
    step: 0,
    collectedData: {},
    requiredFields: INTENT_REQUIRED_FIELDS[intent] || [],
    isComplete: false,
  };
}

// Process user message and generate response
export interface AgentResponse {
  content: string;
  options?: BookingOption[];
  quickReplies?: string[];
  newBookingState?: BookingState | null;
}

export async function processMessage(
  userMessage: string,
  currentBooking: BookingState | null
): Promise<AgentResponse> {
  // Simulate API delay
  await delay(1000 + Math.random() * 1000);

  // If we're in a booking flow
  if (currentBooking && !currentBooking.isComplete) {
    return handleBookingFlow(userMessage, currentBooking);
  }

  // Detect intent from new message
  const intent = detectIntent(userMessage);

  switch (intent) {
    case "GREETING":
      return {
        content: RESPONSE_TEMPLATES.GREETING,
        quickReplies: ["Book a bus ticket", "Find flights", "Schedule appointment"],
      };

    case "BUS_BOOKING":
      const busBooking = createBookingState("BUS_BOOKING");
      const busQuestion = getNextQuestion(busBooking);
      return {
        content: `${RESPONSE_TEMPLATES.BUS_BOOKING_START}\n\n${busQuestion}`,
        newBookingState: busBooking,
      };

    case "FLIGHT_BOOKING":
      const flightBooking = createBookingState("FLIGHT_BOOKING");
      const flightQuestion = getNextQuestion(flightBooking);
      return {
        content: `${RESPONSE_TEMPLATES.FLIGHT_BOOKING_START}\n\n${flightQuestion}`,
        newBookingState: flightBooking,
      };

    case "APPOINTMENT":
      const aptBooking = createBookingState("APPOINTMENT");
      const aptQuestion = getNextQuestion(aptBooking);
      return {
        content: `${RESPONSE_TEMPLATES.APPOINTMENT_START}\n\n${aptQuestion}`,
        newBookingState: aptBooking,
      };

    case "MOVIE_BOOKING":
      const movieBooking = createBookingState("MOVIE_BOOKING");
      const movieQuestion = getNextQuestion(movieBooking);
      return {
        content: `${RESPONSE_TEMPLATES.MOVIE_BOOKING_START}\n\n${movieQuestion}`,
        newBookingState: movieBooking,
      };

    case "GENERAL_QUERY":
      return {
        content: WELCOME_MESSAGE,
        quickReplies: ["Book a bus ticket", "Find flights", "Schedule appointment", "Book movie tickets"],
      };

    default:
      return {
        content: RESPONSE_TEMPLATES.UNKNOWN,
        quickReplies: ["Book a bus ticket", "Find flights", "Help"],
      };
  }
}

// Handle ongoing booking flow
function handleBookingFlow(
  userMessage: string,
  bookingState: BookingState
): AgentResponse {
  const { requiredFields, collectedData, intent } = bookingState;
  
  // Find current field being collected
  let currentField = "";
  for (const field of requiredFields) {
    if (!collectedData[field]) {
      currentField = field;
      break;
    }
  }

  // Extract and store the data
  const extracted = extractData(userMessage, currentField);
  const updatedData = { ...collectedData, ...extracted };
  
  // Create updated booking state
  const updatedBooking: BookingState = {
    ...bookingState,
    step: bookingState.step + 1,
    collectedData: updatedData,
  };

  // Check if all fields are collected
  const allFieldsCollected = requiredFields.every((field) => updatedData[field]);

  if (allFieldsCollected) {
    // Show options
    const options = getMockOptions(intent);
    updatedBooking.isComplete = true;

    // Build summary of collected data
    const summary = Object.entries(updatedData)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join("\n");

    return {
      content: `Great! Here's what I found based on your preferences:\n\n${summary}\n\n${RESPONSE_TEMPLATES.OPTIONS_FOUND}`,
      options,
      newBookingState: null, // Clear booking state after showing options
    };
  }

  // Ask next question
  const nextQuestion = getNextQuestion(updatedBooking);
  
  return {
    content: `Got it! ${nextQuestion}`,
    newBookingState: updatedBooking,
  };
}

// Handle option selection
export async function handleOptionSelection(
  option: BookingOption
): Promise<AgentResponse> {
  await delay(500);
  
  return {
    content: `Excellent choice! You selected **${option.title}** - ${option.subtitle}.\n\n💰 Total: ${option.currency} ${option.price}\n\n${RESPONSE_TEMPLATES.BOOKING_COMPLETE}`,
    quickReplies: ["Confirm booking", "Choose different option", "Cancel"],
  };
}

// Get welcome message
export function getWelcomeMessage(): Message {
  return {
    id: generateId(),
    role: "assistant",
    content: WELCOME_MESSAGE,
    timestamp: new Date(),
    quickReplies: ["Book a bus ticket", "Find flights", "Schedule appointment", "Book movie tickets"],
  };
}
```

---

## How the Agent Works

```
┌─────────────────────────────────────────────────────────────┐
│                      USER MESSAGE                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Is there an active booking flow?                │
└─────────────────┬─────────────────────────┬─────────────────┘
                  │ YES                     │ NO
                  ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│  handleBookingFlow()    │   │    detectIntent()           │
│  - Extract current field│   │    - Match keywords         │
│  - Store data           │   │    - Return Intent type     │
│  - Check if complete    │   └─────────────┬───────────────┘
│  - Ask next Q or show   │                 │
│    options              │                 ▼
└─────────────────────────┘   ┌─────────────────────────────┐
                              │   Create BookingState       │
                              │   Ask first question        │
                              └─────────────────────────────┘
```

---

## Usage in Chat Component

```tsx
import { processMessage, handleOptionSelection, getWelcomeMessage } from "@/lib/chat/agent";
import { useChatContext } from "@/lib/chat/chat-context";

function useChat() {
  const { addMessage, setLoading, setBooking, state } = useChatContext();

  const sendMessage = async (text: string) => {
    // Add user message
    addMessage(text, "user");
    setLoading(true);

    // Process with agent
    const response = await processMessage(text, state.currentBooking);

    // Add assistant message
    addMessage(response.content, "assistant", {
      options: response.options,
      quickReplies: response.quickReplies,
    });

    // Update booking state if needed
    if (response.newBookingState !== undefined) {
      setBooking(response.newBookingState);
    }

    setLoading(false);
  };

  return { sendMessage };
}
```

---

## Verification

1. TypeScript compiles without errors
2. Intent detection works for all intent types
3. Booking flow collects all required fields
4. Options are returned after completing flow
5. Graceful handling of unknown messages

---

## Next Step

→ Proceed to **Prompt 08: Main Chat Page and Demo Flow**
