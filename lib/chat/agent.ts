import {
    Intent,
    BookingState,
    BookingOption,
    Message,
} from "./types";
import {
    WELCOME_MESSAGE,
} from "./mock-data";
import { delay, generateId } from "./utils";
import { getAgentResponse } from "@/app/actions/chat";
import { getOptionsByType } from "@/lib/chat/option-helper";


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
    currency: "NPR",
    details: { qr: "true" },
    available: true
};

const CASH_OPTION: BookingOption = {
    id: "payment_cash",
    type: "payment_cash",
    title: "Pay at Counter",
    subtitle: "Reserve now, pay later",
    price: 0,
    currency: "NPR",
    details: { cash: "true" },
    available: true
};

export async function processMessage(
    userMessage: string,
    currentBooking: BookingState | null,
    allServices: BookingOption[] = []
): Promise<AgentResponse> {

    // HARDCODED INTERCEPTION: Handle Payment Verification
    if (currentBooking && currentBooking.intent !== 'UNKNOWN') {
        const msg = userMessage.toLowerCase();
        // Check for common payment confirmation phrases
        if (msg.includes("paid") || msg.includes("done") || msg.includes("complete") || msg.includes("ok")) {
            // Ensure unique receipt: Check if already complete to avoid double-firing (though UI handles it too)
            if (currentBooking.isComplete) return { content: "This booking is already confirmed! ✅", newBookingState: currentBooking };

            // Return "Waiting for Verification" message
            return {
                content: `⏳ **Verifying Payment...**\n\nPlease wait a moment while our admin confirms your payment details.\n\nWe will send you the receipt shortly!`,
                quickReplies: [], // No quick replies, keep them waiting or allow query? User said 'dont just end conversation'
                newBookingState: {
                    ...currentBooking,
                    collectedData: { ...currentBooking.collectedData, verificationPending: "true" }, // Flag for UI to listen
                    step: 3, // Stay on payment step
                    isComplete: false // Do NOT trigger receipt yet
                }
            };
        }
    }

    // Call AI with empty history for now (we can add conversation history later)
    const aiResponse = await getAgentResponse(userMessage, []);

    console.log("[Agent] AI Response:", aiResponse);

    // Map new System Prompt v2.0 response to legacy format
    let showOptions = aiResponse.showOptions;
    let filterCategory = aiResponse.filterCategory;

    // ✅ FIX: Show options during BOTH gathering AND confirming stages
    if (!showOptions && aiResponse.booking_type) {
        // Show options when gathering info OR confirming
        if (aiResponse.stage === 'gathering' || aiResponse.stage === 'confirming') {
            const typeMap: Record<string, "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING"> = {
                'bus': 'BUS_BOOKING',
                'flight': 'FLIGHT_BOOKING',
                'doctor': 'APPOINTMENT',
                'salon': 'APPOINTMENT',
                'movie': 'MOVIE_BOOKING'
            };
            showOptions = typeMap[aiResponse.booking_type] || null;
            
            console.log(`[Agent] Mapped ${aiResponse.booking_type} + ${aiResponse.stage} → ${showOptions}`);
        }
    }

    // Smart extraction: If AI didn't provide filterCategory but mentioned a specialty
    if (!filterCategory && aiResponse.content) {
        const content = aiResponse.content.toLowerCase();

        // Extract specialty keywords from AI response
        const specialtyKeywords = {
            'cardiologist': /(cardiologist|heart doctor|cardiac|cardio)/,
            'dentist': /(dentist|dental|teeth|tooth|oral)/,
            'dermatologist': /(dermatologist|skin doctor|derma)/,
            'gynecologist': /(gynecologist|women doctor|maternity|gyno)/,
            'urologist': /(urologist|kidney doctor|urology)/,
            'nephrologist': /(nephrologist|kidney specialist|nephro)/,
            'plumber': /(plumber|plumbing|pipe)/,
            'electrician': /(electrician|electric|wiring)/,
            'salon': /(salon|hair|barber|grooming)/,
            'makeup': /(makeup|bridal|party makeup)/,
            'tailor': /(tailor|stitching|alteration)/,
        };

        for (const [specialty, pattern] of Object.entries(specialtyKeywords)) {
            if (pattern.test(content)) {
                filterCategory = specialty;
                console.log(`[Agent] Extracted specialty from content: ${specialty}`);
                break;
            }
        }
    }

    // Fetch options if needed
    let finalOptions: BookingOption[] | undefined;
    if (showOptions) {
        finalOptions = getOptionsByType(showOptions, filterCategory, allServices);
        console.log(`[Agent] Filtered ${finalOptions.length} options for ${showOptions} with category ${filterCategory || 'none'}`);
    }

    return {
        content: aiResponse.content,
        options: finalOptions,
        quickReplies: aiResponse.quickReplies || [],
        newBookingState: currentBooking
    };
}

// Handle option selection
export async function handleOptionSelection(
    option: BookingOption,
    currentBooking?: BookingState | null
): Promise<AgentResponse> {
    await delay(600);

    // 1. Handle "Pay at Counter" Selection (Instant Confirmation)
    if (option.type === 'payment_cash') {
        const existingData = currentBooking?.collectedData || {};
        const priceDisplay = option.price ? `${option.currency || 'NPR'} ${option.price}` : "Pay at Counter";

        return {
            content: `✅ **Reservation Confirmed!**\n\nYou have chosen to pay at the counter. Please arrive 15 minutes early to complete the payment.\n\nHere is your reservation receipt:`,
            quickReplies: ["Book another", "View my bookings"],
            newBookingState: {
                intent: currentBooking?.intent || "APPOINTMENT",
                step: 4,
                collectedData: {
                    ...existingData,
                    price: priceDisplay,
                    cash: "true" // Add cash flag to properly identify Pay at Counter bookings
                },
                requiredFields: [],
                isComplete: true
            }
        };
    }

    // 2. Handle "Scan to Pay" Selection (Just show QR)
    if (option.type === 'payment_qr') {
        return {
            content: `📱 **Scan to Pay**\n\nPlease scan the QR code below with your favorite payment app (Esewa/Khalti).\n\nType **"I have paid"** when you're done!`,
            quickReplies: ["I have paid"],
            newBookingState: null
        };
    }

    // 3. Handle Service Selection (Show Payment Options)
    const paymentRequestMessages: Record<string, string> = {
        bus: `🚌 **Confirm Selection: ${option.title}**\n\n📍 Route: ${option.details.departure || 'Kathmandu'} departure\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        flight: `✈️ **Confirm Selection: ${option.title}**\n\n🛫 Flight to: ${option.details.departure || 'Destination'}\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        appointment: `🏥 **Confirm Appointment: ${option.title}**\n\n📅 Date: ${option.details.nextSlot || 'Upcoming'}\n💰 **Consultation Fee: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        movie: `🎬 **Confirm Tickets: ${option.title}**\n\n🕐 Showtime: ${option.details.showtime || 'Soon'}\n💰 **Total: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
    };

    const message = paymentRequestMessages[option.type] ||
        `**Confirm Selection: ${option.title}**\n\n💰 Total: ${option.currency} ${option.price}\n\nHow would you like to pay?`;

    // Map option type to Intent
    const intentMap: Record<string, Intent> = {
        bus: "BUS_BOOKING",
        flight: "FLIGHT_BOOKING",
        appointment: "APPOINTMENT",
        movie: "MOVIE_BOOKING"
    };

    // Prepare metadata
    const collectedData = {
        serviceId: option.id,
        from: option.details.route || option.title,
        to: option.subtitle,
        date: option.details.date || new Date().toLocaleDateString(),
        specialist: option.title,
        hospital: option.details.hospital,
        theater: option.details.subtitle,
        time: option.details.time || option.details.showtime || option.details.departure,
        price: `${option.currency} ${option.price}`
    };

    // Dynamic Cash Option with correct price
    const dynamicCashOption: BookingOption = {
        ...CASH_OPTION,
        price: option.price,
        currency: option.currency,
        subtitle: `Pay ${option.currency} ${option.price} later`
    };

    return {
        content: message,
        options: [QR_OPTION, dynamicCashOption], // Show Dynamic Cash Option
        quickReplies: ["Cancel"],
        newBookingState: {
            intent: intentMap[option.type] || "UNKNOWN",
            step: 3,
            collectedData: collectedData,
            requiredFields: [],
            isComplete: false
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