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
    category?: string;
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
