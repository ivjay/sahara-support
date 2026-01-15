import {
    Intent,
    BookingState,
    BookingOption,
    Message,
} from "./types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
    WELCOME_MESSAGE,
} from "./mock-data";
import { delay, generateId } from "./utils";
import { getAgentResponse } from "@/app/actions/chat";

// Helper to get options based on the AI's decision
function getOptionsByType(type: string, filterCategory?: string | null): BookingOption[] {
    switch (type) {
        case "BUS_BOOKING":
            return MOCK_BUS_OPTIONS;
        case "FLIGHT_BOOKING":
            return MOCK_FLIGHT_OPTIONS;
        case "APPOINTMENT":
            let options = MOCK_APPOINTMENT_OPTIONS;
            if (filterCategory) {
                options = options.filter(opt =>
                    opt.category?.toLowerCase() === filterCategory.toLowerCase()
                );
            }
            return options;
        case "MOVIE_BOOKING":
            return MOCK_MOVIE_OPTIONS;
        default:
            return [];
    }
}

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

    // Call the server action
    // In a real app, we would pass the actual conversation history here
    const aiResponse = await getAgentResponse(userMessage, []);

    // Get options if the AI decided to show them
    let options: BookingOption[] = [];
    if (aiResponse.showOptions) {
        options = getOptionsByType(aiResponse.showOptions, aiResponse.filterCategory);
    }

    return {
        content: aiResponse.content,
        options: options,
        quickReplies: aiResponse.quickReplies || [],
        // We can extend this later to let AI manage booking state too
        newBookingState: currentBooking
    };
}

// Handle option selection
export async function handleOptionSelection(
    option: BookingOption
): Promise<AgentResponse> {
    await delay(600);

    // We can also move this to the AI later for more dynamic confirmations
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
