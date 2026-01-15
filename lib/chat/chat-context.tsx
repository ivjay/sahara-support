"use client";

import {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    useCallback,
    useEffect,
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

const STORAGE_KEY = "sahara_chat_history_v1";

// Reducer function
function chatReducer(state: ChatState, action: ChatAction | { type: "REHYDRATE", payload: ChatState }): ChatState {
    switch (action.type) {
        case "REHYDRATE":
            return action.payload;

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

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Restore Dates (JSON converts them to strings)
                parsed.messages = parsed.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));

                dispatch({ type: "REHYDRATE", payload: parsed });
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (state.messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } else if (state !== initialState) {
            // If reset to initial state, clear storage too (except maybe userId)
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [state]);

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
        localStorage.removeItem(STORAGE_KEY);
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
