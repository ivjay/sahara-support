import { UserProfile } from "@/lib/user-context";
export type { UserProfile };

export type MessageRole = "user" | "assistant" | "system";

export type Intent =
    | "GREETING"
    | "BUS_BOOKING"
    | "FLIGHT_BOOKING"
    | "APPOINTMENT"
    | "MOVIE_BOOKING"
    | "GENERAL_QUERY"
    | "UNKNOWN";

/**
 * STANDARDIZED BookingOption structure
 * Used by BOTH mocks and admin-created services
 * 
 * CRITICAL: details must be Record<string, string> - ALL values are strings!
 */
export interface BookingOption {
    id: string;
    type: "bus" | "flight" | "appointment" | "movie" | "payment_qr" | "payment_cash";
    category?: string; // doctor, salon, plumber, event, standup, concert, etc.
    title: string; // Main display name
    subtitle: string; // Secondary info (location, route, cinema)
    description?: string; // Brief description of the service
    location?: string; // Origin/venue location
    tags?: string[]; // Searchable keywords for hybrid search
    price: number;
    currency: string;
    details: {
        // Common fields
        from?: string;
        to?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        // Transport specific
        busType?: string;
        aircraft?: string;
        seats?: string;
        // Healthcare specific
        hospital?: string;
        clinic?: string;
        address?: string;
        phone?: string;
        experience?: string;
        nextSlot?: string;
        availableDays?: string;
        timings?: string;
        rating?: string;
        // Entertainment specific
        cinema?: string;
        theater?: string;
        showtime?: string;
        endTime?: string;
        language?: string;
        format?: string;
        // Allow any additional fields
        [key: string]: any;
    };
    available: boolean;
    qrCodeUrl?: string;
    venueId?: string; // For seat selection (movies, buses, flights)
}

// Individual chat message
export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    intent?: Intent;
    options?: BookingOption[];
    receipt?: Record<string, any>;
    quickReplies?: string[];
    seatSelection?: {
        venueId: string;
        serviceId: string;
        eventDate: string;
        eventTime: string;
    };
}

// Booking flow state
export interface BookingState {
    intent: Intent;
    step: number;
    collectedData: Record<string, string>;
    requiredFields: string[];
    isComplete: boolean;
}

// Archived session
export interface ChatSession {
    id: string;
    title: string;
    date: Date;
    preview: string;
    messages: Message[];
    bookingState?: BookingState | null;
}

// Chat context state
export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    currentBooking: BookingState | null;
    userId: string;
    sessions: ChatSession[];
    userProfile?: UserProfile;
    wizardState?: {
        mode: "selector" | "wizard" | "chat";
        service: BookingOption;
        serviceType: "movie" | "bus" | "flight" | "appointment";
        stepData?: Record<string, any>;
    } | null;
}

// Action types for chat reducer
export type ChatAction =
    | { type: "ADD_MESSAGE"; payload: Message }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_BOOKING"; payload: BookingState | null }
    | { type: "CLEAR_CHAT" }
    | { type: "ARCHIVE_SESSION" }
    | { type: "LOAD_SESSION"; payload: string }
    | { type: "DELETE_SESSION"; payload: string }
    | { type: "UPDATE_BOOKING_DATA"; payload: Record<string, string> }
    | { type: "UPDATE_USER_PROFILE"; payload: UserProfile }
    | { type: "SET_WIZARD_STATE"; payload: ChatState["wizardState"] }
    | { type: "UPDATE_WIZARD_STATE_FUNCTIONAL"; payload: (prev: ChatState["wizardState"]) => ChatState["wizardState"] }
    | { type: "REHYDRATE"; payload: ChatState };

export const INTENT_REQUIRED_FIELDS: Record<Intent, string[]> = {
    GREETING: [],
    BUS_BOOKING: ["from", "to", "date", "passengers"],
    FLIGHT_BOOKING: ["from", "to", "departDate", "passengers", "class"],
    APPOINTMENT: ["type", "specialist", "date", "time"],
    MOVIE_BOOKING: ["movie", "theater", "date", "time", "seats"],
    GENERAL_QUERY: [],
    UNKNOWN: [],
};

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

/**
 * STANDARD DETAIL FIELD NAMES
 * Use these consistently across mocks and admin forms
 */
export const STANDARD_DETAILS = {
    // Common fields
    rating: "rating",

    // Doctor/Appointment fields
    hospital: "hospital",
    clinic: "clinic",
    experience: "experience",
    nextSlot: "nextSlot",
    specialization: "specialization",
    specialist: "specialist",

    // Transport fields (bus/flight)
    departure: "departure",
    arrival: "arrival",
    duration: "duration",
    busType: "busType",
    aircraft: "aircraft",
    class: "class",
    seats: "seats",
    route: "route",

    // Movie/Event fields
    showtime: "showtime",
    language: "language",
    format: "format",
    venue: "venue",
    imageUrl: "imageUrl",

    // Service fields (salon, plumber, etc.)
    location: "location",
    responseTime: "responseTime",
    delivery: "delivery"
} as const;