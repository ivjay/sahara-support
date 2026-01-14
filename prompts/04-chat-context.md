# Prompt 04: Chat Context

## Objective
Create a React Context to manage chat state globally. This allows components to share message history, loading state, and booking flow data.

---

## Files to Create

| File | Purpose |
|------|---------|
| `lib/chat/chat-context.tsx` | React Context provider and hook |
| `lib/chat/utils.ts` | Helper functions for IDs and formatting |

---

## Step 1: Create lib/chat/utils.ts

```typescript
// Generate unique message ID
export function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format timestamp for display
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Format date for display
export function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

// Simulate API delay
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

---

## Step 2: Create lib/chat/chat-context.tsx

```tsx
"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from "react";
import {
  ChatState,
  ChatAction,
  Message,
  BookingState,
  MessageRole,
} from "./types";
import { generateId } from "./utils";

// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentBooking: null,
  userId: "demo-user",
};

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_BOOKING":
      return {
        ...state,
        currentBooking: action.payload,
      };

    case "UPDATE_BOOKING_DATA":
      if (!state.currentBooking) return state;
      return {
        ...state,
        currentBooking: {
          ...state.currentBooking,
          collectedData: {
            ...state.currentBooking.collectedData,
            ...action.payload,
          },
        },
      };

    case "CLEAR_CHAT":
      return {
        ...initialState,
        userId: state.userId,
      };

    default:
      return state;
  }
}

// Context type
interface ChatContextType {
  state: ChatState;
  addMessage: (content: string, role: MessageRole, extras?: Partial<Message>) => Message;
  setLoading: (loading: boolean) => void;
  setBooking: (booking: BookingState | null) => void;
  updateBookingData: (data: Record<string, string>) => void;
  clearChat: () => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Add a new message
  const addMessage = useCallback(
    (content: string, role: MessageRole, extras?: Partial<Message>): Message => {
      const message: Message = {
        id: generateId(),
        content,
        role,
        timestamp: new Date(),
        ...extras,
      };
      dispatch({ type: "ADD_MESSAGE", payload: message });
      return message;
    },
    []
  );

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  // Set current booking flow
  const setBooking = useCallback((booking: BookingState | null) => {
    dispatch({ type: "SET_BOOKING", payload: booking });
  }, []);

  // Update booking data
  const updateBookingData = useCallback((data: Record<string, string>) => {
    dispatch({ type: "UPDATE_BOOKING_DATA", payload: data });
  }, []);

  // Clear all messages
  const clearChat = useCallback(() => {
    dispatch({ type: "CLEAR_CHAT" });
  }, []);

  const value: ChatContextType = {
    state,
    addMessage,
    setLoading,
    setBooking,
    updateBookingData,
    clearChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use chat context
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

// Export context for advanced use cases
export { ChatContext };
```

---

## File Structure After This Step

```
lib/
├── utils.ts (existing)
└── chat/
    ├── types.ts
    ├── mock-data.ts
    ├── utils.ts        ✓ (new)
    └── chat-context.tsx ✓ (new)
```

---

## Usage Example

```tsx
// In a component
import { useChatContext } from "@/lib/chat/chat-context";

function ChatComponent() {
  const { state, addMessage, setLoading } = useChatContext();

  const handleSend = async (text: string) => {
    // Add user message
    addMessage(text, "user");
    
    // Show loading
    setLoading(true);
    
    // ... process and add assistant response
    
    setLoading(false);
  };

  return (
    <div>
      {state.messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

---

## Verification

1. Check TypeScript compiles:
   ```powershell
   npx tsc --noEmit
   ```

2. Verify the context is properly typed and exports are correct

---

## Important Notes

> 📝 Uses React 19 patterns with "use client" directive
> 📝 All actions are memoized with useCallback for performance
> 📝 State is immutable and follows reducer pattern
> 📝 Demo user ID is hardcoded for now (auth will come later)

---

## Next Step

→ Proceed to **Prompt 05: Chat UI Components**
