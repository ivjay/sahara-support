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
import { translateToNepali, isNepaliText } from "@/lib/services/translation-service";


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
    allServices: BookingOption[] = [],
    history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AgentResponse> {

    // ✅ IMPROVED: Handle Payment Verification (Only trigger when user confirms payment)
    if (currentBooking && currentBooking.intent !== 'UNKNOWN') {
        const msg = userMessage.toLowerCase();

        // Check if user is confirming they've paid (more specific keywords)
        const paymentConfirmed = (
            (msg.includes("paid") || msg.includes("payment") && (msg.includes("done") || msg.includes("completed"))) ||
            msg.includes("i have paid") ||
            msg.includes("payment done") ||
            msg.includes("paid gareko") ||
            msg.includes("payment garisakeko")
        );

        if (paymentConfirmed) {
            if (currentBooking.isComplete) {
                return {
                    content: "This booking is already confirmed! ✅\n\nYour payment has been verified. Check your receipt above.",
                    newBookingState: currentBooking
                };
            }

            return {
                content: `⏳ **Payment Submitted!**\n\nThank you! Your payment confirmation has been sent to our admin team for verification.\n\n**What happens next:**\n1. Admin will verify your payment (usually within 2-5 minutes)\n2. You'll receive a confirmation message here\n3. Your digital receipt will be generated\n\n*Please keep this chat open to receive your confirmation.*`,
                quickReplies: ["Check status", "Contact support"],
                newBookingState: {
                    ...currentBooking,
                    collectedData: {
                        ...currentBooking.collectedData,
                        verificationPending: "true",
                        paymentSubmittedAt: new Date().toISOString()
                    },
                    step: 4,
                    isComplete: true
                }
            };
        }
    }

    // ✅ Call AI - LLM is in FULL CONTROL
    const aiResponse = await getAgentResponse(userMessage, history);
    console.log("[Agent] 🤖 LLM Response:", aiResponse);

    // ✅ TRANSLATE if Nepali detected
    let finalContent = aiResponse.content;
    if (aiResponse.language === 'ne' || isNepaliText(userMessage)) {
        console.log("[Agent] 🌏 Nepali detected - translating response...");
        try {
            finalContent = await translateToNepali(aiResponse.content);
            console.log("[Agent] ✓ Translated:", finalContent);
        } catch (error) {
            console.error("[Agent] ✗ Translation failed, using English:", error);
            // Keep English if translation fails
        }
    }

    // ✅ TRUST THE LLM - Use its decisions directly
    let showOptions = aiResponse.showOptions;
    let optionType = aiResponse.optionType;
    let filterCategory = aiResponse.filterCategory;

    // 🛡️ SAFETY NET: Force show_options if LLM forgot
    const msg = userMessage.toLowerCase();
    if (!showOptions || showOptions === undefined) {
        // Check for general service requests first
        if (msg.includes('what services') || msg.includes('show services') || msg.includes('what options') ||
            msg.includes('show options') || msg.includes('where are') && msg.includes('options') ||
            msg.includes('available') && (msg.includes('services') || msg.includes('options')) ||
            msg.includes('what can you') || msg.includes('what do you offer')) {
            console.log("[Agent] 🛡️ SAFETY NET: General service request - showing all doctors");
            showOptions = true;
            optionType = "doctor";
            filterCategory = null; // Show all doctors
        }
        // Check for specific service keywords
        else if (msg.includes('therapy') || msg.includes('psychologist') || msg.includes('therapist') ||
                 msg.includes('counseling') || msg.includes('anxious') || msg.includes('anxiety') ||
                 msg.includes('mental health') || msg.includes('depression')) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for therapy request");
            showOptions = true;
            optionType = "doctor";
            filterCategory = "psychologist";
        } else if (msg.includes('pediatrician') || msg.includes('child doctor') || msg.includes('baby doctor') ||
                   msg.includes('child') && msg.includes('doctor')) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for pediatrician request");
            showOptions = true;
            optionType = "doctor";
            filterCategory = "pediatrician";
        } else if (msg.includes('doctor') || msg.includes('appointment') ||
                   (msg.includes('visit') || msg.includes('see')) && (msg.includes('hospital') || msg.includes('clinic'))) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for doctor request");
            showOptions = true;
            optionType = "doctor";
        } else if (msg.includes('bus') || msg.includes('travel') && !msg.includes('flight')) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for bus request");
            showOptions = true;
            optionType = "bus";
        } else if (msg.includes('flight') || msg.includes('fly') || msg.includes('plane')) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for flight request");
            showOptions = true;
            optionType = "flight";
        } else if (msg.includes('movie') || msg.includes('cinema') || msg.includes('film')) {
            console.log("[Agent] 🛡️ SAFETY NET: Forcing show_options for movie request");
            showOptions = true;
            optionType = "movie";
        }
    }

    console.log(`[Agent] LLM Decisions:`, {
        showOptions,
        optionType,
        filterCategory
    });

    // ✅ LLM ALREADY EXTRACTED - No need for hardcoded keywords!
    // The LLM sets filter_category in its response
    // We just use it directly

    // ✅ FETCH OPTIONS based on LLM's decision
    let finalOptions: BookingOption[] | undefined;
    if (showOptions && optionType) {
        // Map LLM's option_type to our internal type
        const typeMap: Record<string, string> = {
            'doctor': 'APPOINTMENT',
            'salon': 'APPOINTMENT',
            'movie': 'MOVIE_BOOKING',
            'bus': 'BUS_BOOKING',
            'flight': 'FLIGHT_BOOKING'
        };

        const internalType = typeMap[optionType] || optionType.toUpperCase() + '_BOOKING';
        finalOptions = getOptionsByType(internalType, filterCategory, allServices);

        console.log(`[Agent] ✅ LLM wanted ${optionType} (${filterCategory || 'all'})`);
        console.log(`[Agent] ✅ Showing ${finalOptions.length} options`);
    }

    return {
        content: finalContent,
        options: finalOptions,
        quickReplies: aiResponse.quickReplies || [],
        newBookingState: currentBooking
    };
}

export async function handleOptionSelection(
    option: BookingOption,
    currentBooking?: BookingState | null
): Promise<AgentResponse> {
    await delay(600);

    if (option.type === 'payment_cash') {
        const existingData = currentBooking?.collectedData || {};
        const isFree = !option.price || option.price === 0;
        const priceDisplay = isFree ? "Free / Pay at Counter" : `${option.currency || 'NPR'} ${option.price}`;

        const content = isFree
            ? `✅ **Booking Confirmed!**\n\nYour booking has been successfully confirmed. Since there is no booking fee, you can proceed directly to the service provider.`
            : `✅ **Reservation Confirmed!**\n\nYou have chosen to pay at the counter. Please arrive **15 minutes early** to handle your booking at the counter and complete the payment.\n\nHere is your reservation receipt:`;

        return {
            content,
            quickReplies: ["Book another", "View my bookings"],
            newBookingState: {
                intent: currentBooking?.intent || "APPOINTMENT",
                step: 4,
                collectedData: {
                    ...existingData,
                    price: priceDisplay,
                    cash: "true"
                },
                requiredFields: [],
                isComplete: true
            }
        };
    }

    if (option.type === 'payment_qr') {
        return {
            content: `📱 **Scan to Pay**\n\nPlease scan the QR code below with your favorite payment app (Esewa/Khalti).\n\nType **"I have paid"** when you're done!`,
            quickReplies: ["I have paid"],
            newBookingState: null
        };
    }

    const paymentRequestMessages: Record<string, string> = {
        bus: `🚌 **Confirm Selection: ${option.title}**\n\n📍 Route: ${option.details.departure || 'Kathmandu'} departure\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        flight: `✈️ **Confirm Selection: ${option.title}**\n\n🛫 Flight to: ${option.details.departure || 'Destination'}\n💰 **Amount Due: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        appointment: `🏥 **Confirm Appointment: ${option.title}**\n\n📅 Date: ${option.details.nextSlot || 'Upcoming'}\n💰 **Consultation Fee: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
        movie: `🎬 **Confirm Tickets: ${option.title}**\n\n🕐 Showtime: ${option.details.showtime || 'Soon'}\n💰 **Total: ${option.currency} ${option.price}**\n\nHow would you like to pay?`,
    };

    const message = paymentRequestMessages[option.type] ||
        `**Confirm Selection: ${option.title}**\n\n💰 Total: ${option.currency} ${option.price}\n\nHow would you like to pay?`;

    const intentMap: Record<string, Intent> = {
        bus: "BUS_BOOKING",
        flight: "FLIGHT_BOOKING",
        appointment: "APPOINTMENT",
        movie: "MOVIE_BOOKING"
    };

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

    // ✅ FIX: Create dynamic QR option with actual price
    const dynamicQROption: BookingOption = {
        ...QR_OPTION,
        price: option.price,
        currency: option.currency,
        subtitle: `Total: ${option.currency} ${option.price}`
    };

    const dynamicCashOption: BookingOption = {
        ...CASH_OPTION,
        price: option.price,
        currency: option.currency,
        subtitle: `Pay ${option.currency} ${option.price} later`
    };

    return {
        content: message,
        options: [dynamicQROption, dynamicCashOption],
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

export function getWelcomeMessage(): Message {
    return {
        id: generateId(),
        role: "assistant",
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
        quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
    };
}