import {
    Intent,
    BookingState,
    BookingOption,
    Message,
} from "./types";
import {
    INTENT_KEYWORDS,
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
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

// Get intent-specific intro message
function getIntentIntro(intent: Intent): string {
    switch (intent) {
        case "BUS_BOOKING":
            return "🚌 **Bus Booking**\n\nI found these available bus options for you. Here are the best routes with real-time availability:";
        case "FLIGHT_BOOKING":
            return "✈️ **Flight Search**\n\nHere are the available flights I found. All prices include taxes and fees:";
        case "APPOINTMENT":
            return "🏥 **Doctor Appointments**\n\nI found these doctors with available slots. All are highly rated professionals:";
        case "MOVIE_BOOKING":
            return "🎬 **Movie Tickets**\n\nHere's what's playing today! Select a show to book your seats:";
        default:
            return "Here are the available options:";
    }
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
    await delay(800 + Math.random() * 600);

    // Detect intent from message
    const intent = detectIntent(userMessage);

    switch (intent) {
        case "GREETING":
            return {
                content: "Hello! 👋 Welcome to Sahara. I'm here to help you with bookings and appointments.\n\nWhat would you like to do today?",
                quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
            };

        case "BUS_BOOKING":
            const busOptions = getMockOptions("BUS_BOOKING");
            return {
                content: getIntentIntro("BUS_BOOKING"),
                options: busOptions,
                quickReplies: ["Show more options", "Different route", "Back to menu"],
            };

        case "FLIGHT_BOOKING":
            const flightOptions = getMockOptions("FLIGHT_BOOKING");
            return {
                content: getIntentIntro("FLIGHT_BOOKING"),
                options: flightOptions,
                quickReplies: ["Different dates", "More airlines", "Back to menu"],
            };

        case "APPOINTMENT":
            const appointmentOptions = getMockOptions("APPOINTMENT");
            return {
                content: getIntentIntro("APPOINTMENT"),
                options: appointmentOptions,
                quickReplies: ["Different specialty", "Different hospital", "Back to menu"],
            };

        case "MOVIE_BOOKING":
            const movieOptions = getMockOptions("MOVIE_BOOKING");
            return {
                content: getIntentIntro("MOVIE_BOOKING"),
                options: movieOptions,
                quickReplies: ["Different movie", "Different time", "Back to menu"],
            };

        case "GENERAL_QUERY":
            return {
                content: "I can help you with the following services:\n\n• 🚌 **Bus Tickets** - Book comfortable bus rides\n• ✈️ **Flights** - Find and book flights\n• 🏥 **Appointments** - Schedule doctor visits\n• 🎬 **Movies** - Book cinema tickets\n\nJust tell me what you need!",
                quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
            };

        default:
            return {
                content: "I'm not sure I understood that. Let me show you what I can help with:\n\n• **Bus Booking** - Say \"book a bus\"\n• **Flights** - Say \"find flights\"\n• **Appointments** - Say \"doctor appointment\"\n• **Movies** - Say \"movie tickets\"\n\nOr just tap one of the options below!",
                quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
            };
    }
}

// Handle option selection
export async function handleOptionSelection(
    option: BookingOption
): Promise<AgentResponse> {
    await delay(600);

    const confirmationMessages: Record<string, string> = {
        bus: `🚌 **Booking Confirmed!**\n\nYou've selected **${option.title}**\n${option.subtitle}\n\n📍 Route: ${option.details.departure || ''} departure\n⏱️ Duration: ${option.details.duration || ''}\n💺 Type: ${option.details.busType || option.details.class || ''}\n\n💰 **Total: ${option.currency} ${option.price}**\n\n✅ Your booking reference: **SAH${Date.now().toString().slice(-6)}**\n\nYou'll receive a confirmation SMS shortly.`,

        flight: `✈️ **Flight Booked!**\n\nYou've selected **${option.title}**\n${option.subtitle}\n\n🛫 Departure: ${option.details.departure || ''}\n✈️ Aircraft: ${option.details.aircraft || ''}\n💺 Class: ${option.details.class || ''}\n\n💰 **Total: ${option.currency} ${option.price}**\n\n✅ Booking reference: **SAH${Date.now().toString().slice(-6)}**\n\nE-ticket will be sent to your email.`,

        appointment: `🏥 **Appointment Scheduled!**\n\nYou've booked with **${option.title}**\n${option.subtitle}\n\n🏥 ${option.details.hospital || ''}\n📅 ${option.details.nextSlot || ''}\n👨‍⚕️ Experience: ${option.details.experience || ''}\n\n💰 **Consultation Fee: ${option.currency} ${option.price}**\n\n✅ Appointment ID: **SAH${Date.now().toString().slice(-6)}**\n\nReminder will be sent before your appointment.`,

        movie: `🎬 **Tickets Booked!**\n\nYou're watching **${option.title}**\n${option.subtitle}\n\n🕐 Showtime: ${option.details.showtime || ''}\n🎞️ Format: ${option.details.format || ''}\n🌐 Language: ${option.details.language || ''}\n\n💰 **Total: ${option.currency} ${option.price}**\n\n✅ Booking ID: **SAH${Date.now().toString().slice(-6)}**\n\nShow this at the counter to collect your tickets.`,
    };

    const message = confirmationMessages[option.type] ||
        `✅ **Booking Confirmed!**\n\nYou've selected: ${option.title}\n\n💰 Total: ${option.currency} ${option.price}\n\nReference: SAH${Date.now().toString().slice(-6)}`;

    return {
        content: message,
        quickReplies: ["Book another", "View my bookings", "Rate this experience"],
    };
}

// Get welcome message
export function getWelcomeMessage(): Message {
    return {
        id: generateId(),
        role: "assistant",
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
        quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
    };
}
