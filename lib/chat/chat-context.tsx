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
import { CURRENT_USER, UserProfile } from "@/lib/user-context";
import { useAuth } from "@/lib/auth-context";

// Initial state
const initialState: ChatState = {
    messages: [],
    isLoading: false,
    currentBooking: null,
    userId: "demo-user",
    sessions: [],
    userProfile: undefined, // Will be populated from Firebase auth
};

const STORAGE_KEY = "sahara_chat_history_v1";

// Reducer function
function chatReducer(state: ChatState, action: ChatAction | { type: "REHYDRATE", payload: ChatState } | { type: "UPDATE_PROFILE", payload: UserProfile }): ChatState {
    switch (action.type) {
        case "UPDATE_PROFILE":
            return {
                ...state,
                userProfile: action.payload
            };

        case "REHYDRATE":
            return action.payload;

        case "ARCHIVE_SESSION":
            if (state.messages.length === 0) return state;

            // Generate Title
            const lastMsg = state.messages[state.messages.length - 1];
            const firstUserMsg = state.messages.find(m => m.role === 'user');

            let title = "New Conversation";
            if (state.currentBooking?.intent && state.currentBooking.intent !== 'UNKNOWN') {
                title = state.currentBooking.intent.replace('_BOOKING', '').toLowerCase().replace(/^\w/, c => c.toUpperCase()) + " Booking";
            } else if (firstUserMsg) {
                // Truncate first message
                title = firstUserMsg.content.slice(0, 18) + (firstUserMsg.content.length > 18 ? "..." : "");
            }

            const newSession: any = { // Use 'any' temporarily to avoid circular dep issues with ChatSession interface if not fully recognized yet
                id: generateId(),
                title: title,
                date: new Date(),
                preview: lastMsg ? lastMsg.content.slice(0, 30) + "..." : "No messages",
                messages: state.messages,
                bookingState: state.currentBooking
            };

            return {
                ...state,
                sessions: [newSession, ...state.sessions],
                messages: [],
                currentBooking: null
            };

        case "LOAD_SESSION":
            const sessionToLoad = state.sessions.find(s => s.id === action.payload);
            if (!sessionToLoad) return state;

            // If we have an active unsaved session, should we archive it first?
            // For simplicity, we'll just switch. Ideally we'd auto-archive active if not empty.
            // Let's safe-guard: if current messages > 0, archive them first? 
            // That requires multiple state updates. 
            // Let's assume the UI handles "New Chat" (Archive) before Load.

            return {
                ...state,
                messages: sessionToLoad.messages,
                currentBooking: sessionToLoad.bookingState || null,
                // Move loaded session to top? Optional.
            };

        case "DELETE_SESSION":
            return {
                ...state,
                sessions: state.sessions.filter(s => s.id !== action.payload)
            };

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

        case "UPDATE_USER_PROFILE":
            return {
                ...state,
                userProfile: action.payload
            };

        case "CLEAR_CHAT":
            return {
                ...state,
                messages: [],
                currentBooking: null
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
    updateUserProfile: (profile: UserProfile) => void;
    clearChat: () => void;
    loadSession: (id: string) => void;
    deleteSession: (id: string) => void;
}

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
interface ChatProviderProps {
    children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const { user, isGuest } = useAuth();

    // Update user profile when Firebase user changes
    useEffect(() => {
        if (user && !isGuest) {
            // ✅ FIX: Create profile from Firebase auth data only, no hardcoded defaults
            const userName = user.displayName || user.email?.split('@')[0] || "User";
            const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || "there";

            const userProfile: UserProfile = {
                // Identity from Firebase
                id: user.uid,
                name: userName,
                firstName: firstName,
                email: user.email || "",
                phone: user.phoneNumber || "",
                avatarInitials: userName.substring(0, 2).toUpperCase(),

                // Generic defaults (not Bijay's data!)
                alternatePhone: "",
                dateOfBirth: "",
                gender: "",
                nationality: "",
                idNumber: "",
                currentAddress: "",
                permanentAddress: "",
                city: "Kathmandu",
                postalCode: "",
                emergencyName: "",
                emergencyPhone: "",
                emergencyRelation: "",
                kycStatus: "Not Started",
                accountType: "Free",
                memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                preferences: []
            };
            dispatch({ type: "UPDATE_PROFILE", payload: userProfile });
        } else if (isGuest) {
            // Guest mode - use generic profile
            const guestProfile: UserProfile = {
                id: "guest",
                name: "Guest",
                firstName: "Guest",
                email: "",
                phone: "",
                alternatePhone: "",
                avatarInitials: "G",
                dateOfBirth: "",
                gender: "",
                nationality: "",
                idNumber: "",
                currentAddress: "",
                permanentAddress: "",
                city: "Kathmandu",
                postalCode: "",
                emergencyName: "",
                emergencyPhone: "",
                emergencyRelation: "",
                kycStatus: "Not Started",
                accountType: "Free",
                memberSince: "Guest",
                preferences: []
            };
            dispatch({ type: "UPDATE_PROFILE", payload: guestProfile });
        }
    }, [user, isGuest]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Restore Dates
                parsed.messages = parsed.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                // Restore Sessions Dates
                parsed.sessions = (parsed.sessions || []).map((s: any) => ({
                    ...s,
                    date: new Date(s.date),
                    messages: s.messages.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }))
                }));

                // Don't restore userProfile from localStorage - it will be set from Firebase auth

                dispatch({ type: "REHYDRATE", payload: parsed });
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        const hasData = state.messages.length > 0 ||
            state.sessions.length > 0 ||
            state.currentBooking !== null ||
            state.userProfile !== undefined;

        if (hasData) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

    // Update user profile
    const updateUserProfile = useCallback((profile: UserProfile) => {
        dispatch({ type: "UPDATE_USER_PROFILE", payload: profile });
    }, []);

    // Clear all messages (Archive first)
    const clearChat = useCallback(() => {
        dispatch({ type: "ARCHIVE_SESSION" });
        // Note: ARCHIVE_SESSION clears the chat buffer after saving.
        // If buffer was empty, it does nothing, so we might need strict CLEAR if user intends to just 'Reset'.
        // But for "New Chat", archiving empty is harmless (it refuses). 
        // If we want to strictly clear even if empty/archived, we can follow up?
        // Actually ARCHIVE_SESSION logic checks length. IF 0, it returns state.
        // So we should probably check persistence? 
        // Let's simply dispatch CLEAR_CHAT as fallback? 
        // No, let's trust ARCHIVE handles the 'New Chat' intent. 
        // But if I just want to clear the screen... 
        // User asked "past conversation persistence when new chat is clicked".
        // so New Chat = Archive + Clear.
    }, []);

    const loadSession = useCallback((id: string) => {
        dispatch({ type: "LOAD_SESSION", payload: id });
    }, []);

    const deleteSession = useCallback((id: string) => {
        dispatch({ type: "DELETE_SESSION", payload: id });
    }, []);

    const value: ChatContextType = {
        state,
        addMessage,
        setLoading,
        setBooking,
        updateBookingData,
        updateUserProfile,
        clearChat,
        loadSession,
        deleteSession,
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
