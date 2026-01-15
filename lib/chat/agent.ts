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

const QR_OPTION: BookingOption = {
    id: "payment_qr",
    type: "payment_qr",
    title: "Scan to Pay",
    subtitle: "E-Sewa / Khalti / ConnectIPS",
    price: 0,
    details: { qr: "true" },
    available: true
};

export async function processMessage(
    userMessage: string,
    currentBooking: BookingState | null
): Promise<AgentResponse> {

    // HARDCODED INTERCEPTION: Handle Payment Verification
    // We check if there is ANY active booking intent and the user says "paid"
    if (currentBooking && currentBooking.intent !== 'UNKNOWN') {
        const msg = userMessage.toLowerCase();
        // Check for common payment confirmation phrases
        if (msg.includes("paid") || msg.includes("done") || msg.includes("complete") || msg.includes("ok")) {
            return {
                content: `✅ **Payment Verified!**\n\nThank you! Your booking has been confirmed. I've generated your receipt below.`,
                quickReplies: ["Book another", "View my bookings"],
                newBookingState: {
                    ...currentBooking,
                    step: 4,
                    isComplete: true // Triggers the Receipt Modal
                }
            };
        }
    }

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

    const paymentRequestMessages: Record<string, string> = {
        bus: `🚌 **Confirm Selection: ${option.title}**\n\n📍 Route: ${option.details.departure || 'Kathmandu'} departure\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nPlease scan the QR code to complete your payment.`,
        flight: `✈️ **Confirm Selection: ${option.title}**\n\n🛫 Flight to: ${option.details.departure || 'Destination'}\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nPlease scan the QR code to issue your e-ticket.`,
        appointment: `🏥 **Confirm Appointment: ${option.title}**\n\n📅 Date: ${option.details.nextSlot || 'Upcoming'}\n💰 **Consultation Fee: ${option.currency} ${option.price}**\n\nPlease pay the booking fee to confirm.`,
        movie: `🎬 **Confirm Tickets: ${option.title}**\n\n🕐 Showtime: ${option.details.showtime || 'Soon'}\n💰 **Total: ${option.currency} ${option.price}**\n\nScan to pay and grab your seats!`,
    };

    const message = paymentRequestMessages[option.type] ||
        `**Confirm Selection: ${option.title}**\n\n💰 Total: ${option.currency} ${option.price}\n\nPlease scan to pay.`;

    // Map option type to Intent
    const intentMap: Record<string, Intent> = {
        bus: "BUS_BOOKING",
        flight: "FLIGHT_BOOKING",
        appointment: "APPOINTMENT",
        movie: "MOVIE_BOOKING"
    };

    // Prepare metadata for the receipt later
    const collectedData = {
        from: option.details.route || option.title,
        to: option.subtitle,
        date: option.details.date || new Date().toLocaleDateString(),
        specialist: option.title,
        time: option.details.time || option.details.showtime || option.details.departure,
        price: `${option.currency} ${option.price}`
    };

    return {
        content: message,
        options: [QR_OPTION], // Send QR Option
        quickReplies: ["Paid", "I have paid", "Cancel"],
        newBookingState: {
            intent: intentMap[option.type] || "UNKNOWN",
            step: 3, // Payment Step
            collectedData: collectedData,
            requiredFields: [],
            isComplete: false // Do NOT trigger modal yet
        }
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
