import {
    Intent,
    BookingState,
    BookingOption,
    Message,
    UserProfile
} from "./types";
import { delay, generateId } from "./utils";
import { getAgentResponse } from "@/app/actions/chat";
import { getOptionsByType } from "@/lib/chat/option-helper";
import { translateToNepali, isNepaliText } from "@/lib/services/translation-service";


export interface AgentResponse {
    content: string;
    options?: BookingOption[];
    quickReplies?: string[];
    newBookingState?: BookingState | null;
    stage?: string;
    collected_details?: Record<string, any>;
    language?: string;
    seatSelection?: {
        venueId: string;
        serviceId: string;
        eventDate: string;
        eventTime: string;
    };
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
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
    userProfile?: UserProfile
): Promise<AgentResponse> {

    // ✅ IMPROVED: Handle Payment Verification (Only trigger when user confirms payment)
    if (currentBooking && currentBooking.intent !== 'UNKNOWN') {
        const msg = userMessage.toLowerCase();

        // Check if user is confirming they've paid (more specific keywords)
        // Avoid false positives like "I haven't paid" by checking for negative keywords
        const hasNegativeKeyword = msg.includes("not") || msg.includes("haven't") || msg.includes("didn't") ||
            msg.includes("gareko chaina") || msg.includes("gareko chhaina");

        const paymentConfirmed = !hasNegativeKeyword && (
            msg.includes("i have paid") ||
            msg.includes("payment done") ||
            msg.includes("payment completed") ||
            msg.includes("paid successfully") ||
            msg.includes("paid gareko") ||
            msg.includes("payment garisakeko") ||
            msg.includes("payment gareko")
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
    const aiResponse = await getAgentResponse(userMessage, history, userProfile);
    console.log("[Agent] 🤖 LLM Response:", aiResponse);

    // ✅ TRANSLATE if Nepali detected
    let finalContent = aiResponse.content || "I'm here to help! What would you like to do?";
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

    // 📅 Handle "view my bookings/appointments" directly
    if (msg.includes('view my') || msg.includes('my booking') || msg.includes('my appointment') ||
        msg.includes('show my booking') || msg.includes('my meetings') || msg.includes('my reservations')) {
        return {
            content: `To see all your bookings and appointments, head to your **Profile** page!\n\nYou'll find:\n- 📅 All upcoming appointments\n- 🚌 Bus & flight reservations\n- 🎬 Movie tickets\n- Full details: date, time, location & status\n\nJust tap the **Profile icon** (top right) to access it. Is there anything else I can help you with?`,
            quickReplies: ["Book something new", "Reschedule an appointment"],
            newBookingState: currentBooking
        };
    }

    // 🔄 Handle reschedule requests — pass to LLM but add context
    if (msg.includes('reschedule') || (msg.includes('change') && (msg.includes('appointment') || msg.includes('booking') || msg.includes('time') || msg.includes('date')))) {
        // LLM will handle this, but ensure we don't accidentally show booking options
        showOptions = false;
    }

    // Check conversation history for specialty mentions (context-aware)
    const recentHistory = history.slice(-3).map(m => m.content).join(' ').toLowerCase();
    const fullContext = msg + ' ' + recentHistory;

    if (!showOptions) {
        // Essential keywords for quick intent detection
        const doctorKeywords = ['doctor', 'appointment', 'visit', 'hospital', 'clinic', 'dentist', 'therapy', 'surgeon', 'ortho', 'derma', 'skin', 'eye', 'checkup'];
        const busKeywords = ['bus', 'travel', 'yatra', 'sajha'];
        const flightKeywords = ['flight', 'fly', 'plane', 'yeti', 'buddha'];
        const movieKeywords = ['movie', 'cinema', 'film', 'qfx', 'big movies'];

        if (doctorKeywords.some(k => fullContext.includes(k))) {
            showOptions = true;
            optionType = "doctor";
            // Extract specific category if possible
            const specialties = ['dentist', 'psychologist', 'cardiologist', 'pediatrician', 'orthopedic', 'dermatologist'];
            filterCategory = specialties.find(s => fullContext.includes(s.substring(0, 5))) || null;
        } else if (busKeywords.some(k => fullContext.includes(k))) {
            showOptions = true;
            optionType = "bus";
        } else if (flightKeywords.some(k => fullContext.includes(k))) {
            showOptions = true;
            optionType = "flight";
        } else if (movieKeywords.some(k => fullContext.includes(k))) {
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
        newBookingState: currentBooking,
        stage: aiResponse.stage,
        collected_details: aiResponse.collected_details,
        language: aiResponse.language
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

    const needsSeats = option.type === 'movie' || option.type === 'bus' || option.type === 'flight';

    if (needsSeats) {
        return {
            content: `Great choice! 🎬 **${option.title}** looks perfect. \n\nPlease select your seats from the map below so I can get your tickets ready!`,
            newBookingState: {
                intent: intentMap[option.type] || "UNKNOWN",
                step: 2, // Gathering details (seats)
                collectedData: {
                    serviceId: option.id,
                    serviceTitle: option.title,
                    price: `${option.currency} ${option.price}`
                },
                requiredFields: [],
                isComplete: false
            },
            // Metadata to trigger ChatSeatPicker
            stage: "seating",
            seatSelection: {
                venueId: option.venueId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                serviceId: option.id,
                eventDate: option.details?.date || new Date().toISOString().split('T')[0],
                eventTime: option.details?.time || option.details?.showtime || 'all-day'
            },
            language: "en"
        };
    }

    const collectedData = {
        serviceId: option.id,
        from: option.details.route || option.title,
        to: option.subtitle,
        date: option.details.date || new Date().toLocaleDateString(),
        specialist: option.title,
        hospital: option.details.hospital || '',
        theater: option.details.subtitle || '',
        time: option.details.time || option.details.showtime || option.details.departure || '',
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
        content: "Namaste! I'm **Sahara**, your personal assistant. I can help you book **bus tickets**, **flights**, **doctor appointments**, or **movies** across Nepal. \n\nHow can I help you today?",
        timestamp: new Date(),
        quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
    };
}