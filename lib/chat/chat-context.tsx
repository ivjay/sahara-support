"use client";

import {
    createContext,
    useContext,
    useReducer,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
} from "react";
import {
    ChatState,
    ChatAction,
    ChatSession,
    Message,
    BookingState,
    MessageRole,
} from "./types";
import { generateId } from "./utils";
import { CURRENT_USER, UserProfile } from "@/lib/user-context";
import { useAuth } from "@/lib/auth-context";
import { getProfile, updateProfile as supabaseUpdateProfile } from "@/lib/supabase";

// Initial state
const initialState: ChatState = {
    messages: [],
    isLoading: false,
    currentBooking: null,
    wizardState: null,
    userId: "demo-user",
    sessions: [],
    userProfile: undefined, // Will be populated from Firebase auth
};

const STORAGE_KEY_PREFIX = "sahara_chat_v2_";

// Reducer function
function chatReducer(state: ChatState, action: ChatAction | { type: "REHYDRATE", payload: ChatState } | { type: "UPDATE_PROFILE", payload: UserProfile } | { type: "SET_USER_ID", payload: string }): ChatState {
    switch (action.type) {
        case "SET_USER_ID":
            return {
                ...state,
                userId: action.payload
            };
        case "UPDATE_PROFILE":
            return {
                ...state,
                userProfile: action.payload
            };

        case "REHYDRATE":
            return {
                ...state,
                ...action.payload,
                // Ensure we don't accidentally overwrite the userProfile if rehydrating from a broad state
            };

        case "ARCHIVE_SESSION":
            if (state.messages.length === 0) return state;

            const lastMsg = state.messages[state.messages.length - 1];
            const firstUserMsg = state.messages.find(m => m.role === 'user');

            let title = "New Conversation";
            if (state.currentBooking?.intent && state.currentBooking.intent !== 'UNKNOWN') {
                title = state.currentBooking.intent.replace('_BOOKING', '').toLowerCase().replace(/^\w/, c => c.toUpperCase()) + " Booking";
            } else if (firstUserMsg) {
                title = firstUserMsg.content.slice(0, 18) + (firstUserMsg.content.length > 18 ? "..." : "");
            }

            const newSession: ChatSession = {
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

            return {
                ...state,
                messages: sessionToLoad.messages,
                currentBooking: sessionToLoad.bookingState || null,
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
                currentBooking: null,
                wizardState: null
            };

        case "SET_WIZARD_STATE":
            return {
                ...state,
                wizardState: action.payload
            };

        case "UPDATE_WIZARD_STATE_FUNCTIONAL":
            return {
                ...state,
                wizardState: action.payload(state.wizardState)
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
    updateUserProfile: (profile: UserProfile) => Promise<void>;
    clearChat: () => void;
    loadSession: (id: string) => void;
    deleteSession: (id: string) => void;
    setWizardState: (state: ChatState["wizardState"] | ((prev: ChatState["wizardState"]) => ChatState["wizardState"])) => void;
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

    // Derived storage key based on user ID to isolate history
    const effectiveUserId = isGuest ? "guest" : (user?.uid || "guest");
    const USER_STORAGE_KEY = `${STORAGE_KEY_PREFIX}${effectiveUserId}`;

    // 1. Sync Profile from Supabase on Auth Change
    useEffect(() => {
        async function syncProfile() {
            if (user && !isGuest) {
                dispatch({ type: "SET_USER_ID", payload: user.uid });

                try {
                    // Fetch existing profile from Supabase
                    const dbProfile = await getProfile(user.uid);

                    const userName = user.displayName || user.email?.split('@')[0] || "User";
                    const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || "there";

                    const baseProfile: UserProfile = {
                        id: user.uid,
                        name: dbProfile?.full_name || userName,
                        firstName: dbProfile?.first_name || firstName,
                        email: user.email || "",
                        phone: dbProfile?.phone || user.phoneNumber || "",
                        avatarInitials: (dbProfile?.full_name || userName || "U").substring(0, 2).toUpperCase(),
                        alternatePhone: dbProfile?.alternate_phone || "",
                        dateOfBirth: dbProfile?.date_of_birth || "",
                        gender: dbProfile?.gender || "",
                        nationality: dbProfile?.nationality || "Nepali",
                        idNumber: dbProfile?.id_number || "",
                        currentAddress: dbProfile?.current_address || "",
                        permanentAddress: dbProfile?.permanent_address || "",
                        city: dbProfile?.city || "Kathmandu",
                        postalCode: dbProfile?.postal_code || "",
                        emergencyName: dbProfile?.emergency_name || "",
                        emergencyPhone: dbProfile?.emergency_phone || "",
                        emergencyRelation: dbProfile?.emergency_relation || "",
                        kycStatus: dbProfile?.kyc_status || "Not Started",
                        accountType: dbProfile?.account_type || "Free",
                        memberSince: dbProfile?.created_at ? new Date(dbProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        preferences: dbProfile?.preferences || []
                    };

                    dispatch({ type: "UPDATE_PROFILE", payload: baseProfile });
                } catch (err) {
                    console.error("[ChatProvider] Profile fetch failed:", err);
                }
            } else if (isGuest) {
                dispatch({ type: "SET_USER_ID", payload: "guest" });
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
        }

        syncProfile();
    }, [user, isGuest]);

    // 2. Load from user-specific localStorage on mount or user change
    useEffect(() => {
        const saved = localStorage.getItem(USER_STORAGE_KEY);

        // GUEST TO USER MIGRATION: 
        // If we just logged in (effectiveUserId is not "guest") but there is no saved data for this user,
        // check if there is saved data for "guest" and migrate it.
        if (!saved && effectiveUserId !== "guest") {
            const guestData = localStorage.getItem(`${STORAGE_KEY_PREFIX}guest`);
            if (guestData) {
                console.log("[ChatProvider] 🚚 Migrating guest history to user:", effectiveUserId);
                localStorage.setItem(USER_STORAGE_KEY, guestData);
                // Optionally clear guest data? 
                // localStorage.removeItem(`${STORAGE_KEY_PREFIX}guest`);

                // Now reload from the newly created user key
                const freshSaved = localStorage.getItem(USER_STORAGE_KEY);
                if (freshSaved) {
                    try {
                        const parsed = JSON.parse(freshSaved);
                        parsed.messages = (parsed.messages || []).map((m: Record<string, unknown>) => ({
                            ...m,
                            timestamp: new Date(m.timestamp as string)
                        }));
                        parsed.sessions = (parsed.sessions || []).map((s: Record<string, unknown>) => ({
                            ...s,
                            date: new Date(s.date as string),
                            messages: ((s.messages || []) as Record<string, unknown>[]).map((m: Record<string, unknown>) => ({
                                ...m,
                                timestamp: new Date(m.timestamp as string)
                            }))
                        }));
                        dispatch({ type: "REHYDRATE", payload: { ...parsed, userId: effectiveUserId } });
                        return; // Done
                    } catch (e) {
                        console.error("Failed to migrate guest data", e);
                    }
                }
            }
        }

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                parsed.messages = (parsed.messages || []).map((m: Record<string, unknown>) => ({
                    ...m,
                    timestamp: new Date(m.timestamp as string)
                }));
                parsed.sessions = (parsed.sessions || []).map((s: Record<string, unknown>) => ({
                    ...s,
                    date: new Date(s.date as string),
                    messages: ((s.messages || []) as Record<string, unknown>[]).map((m: Record<string, unknown>) => ({
                        ...m,
                        timestamp: new Date(m.timestamp as string)
                    }))
                }));

                // Rehydrate but PRESERVE the current userProfile we just got from DB
                dispatch({ type: "REHYDRATE", payload: { ...parsed, userId: effectiveUserId } });
            } catch (e) {
                console.error("Failed to load user chat history", e);
            }
        } else {
            // New user or no history for THIS identity, clear current session
            dispatch({ type: "CLEAR_CHAT" });
        }
    }, [effectiveUserId, USER_STORAGE_KEY]);

    // 3. Save to user-specific localStorage on change
    useEffect(() => {
        const hasData = state.messages.length > 0 ||
            state.sessions.length > 0 ||
            state.currentBooking !== null;

        if (hasData) {
            // Save everything EXCEPT the userProfile (which comes from DB) to avoid stale data
            const { userProfile, ...persistState } = state;
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(persistState));
        }
    }, [state, USER_STORAGE_KEY]);

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

    // Update user profile with Supabase sync
    const updateUserProfile = useCallback(async (profile: UserProfile) => {
        dispatch({ type: "UPDATE_USER_PROFILE", payload: profile });

        const effectiveUserId = isGuest ? "guest" : (user?.uid || "guest");
        if (effectiveUserId !== 'guest') {
            try {
                await supabaseUpdateProfile(effectiveUserId, {
                    full_name: profile.name,
                    first_name: profile.firstName,
                    phone: profile.phone,
                    date_of_birth: profile.dateOfBirth,
                    gender: profile.gender,
                    nationality: profile.nationality,
                    id_number: profile.idNumber,
                    current_address: profile.currentAddress,
                    permanent_address: profile.permanentAddress,
                    city: profile.city,
                    postal_code: profile.postalCode,
                    emergency_name: profile.emergencyName,
                    emergency_phone: profile.emergencyPhone,
                    emergency_relation: profile.emergencyRelation,
                    preferences: profile.preferences || []
                });
                console.log("[ChatContext] ✓ Profile synced to Supabase");
            } catch (error) {
                console.error("[ChatContext] ✗ Failed to sync profile:", error);
            }
        }
    }, [isGuest, user?.uid]);

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

    const setWizardState = useCallback((wizardState: ChatState["wizardState"] | ((prev: ChatState["wizardState"]) => ChatState["wizardState"])) => {
        if (typeof wizardState === 'function') {
            // We need to access the current state. Since this is in the provider, we can use a ref or just rely on dispatch handling it if we added a new action type.
            // But easier is to just add a functional update action to the reducer.
            dispatch({ type: "UPDATE_WIZARD_STATE_FUNCTIONAL", payload: wizardState });
        } else {
            dispatch({ type: "SET_WIZARD_STATE", payload: wizardState });
        }
    }, []);

    const value = useMemo(() => ({
        state,
        addMessage,
        setLoading,
        setBooking,
        updateBookingData,
        updateUserProfile,
        clearChat,
        loadSession,
        deleteSession,
        setWizardState,
    }), [
        state,
        addMessage,
        setLoading,
        setBooking,
        updateBookingData,
        updateUserProfile,
        clearChat,
        loadSession,
        deleteSession,
        setWizardState,
    ]);

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
