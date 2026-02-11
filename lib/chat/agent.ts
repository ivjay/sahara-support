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
function getOptionsByType(type: string, filterCategory?: string | null, allServices: BookingOption[] = []): BookingOption[] {
    // 1. Merge Default Mocks with Dynamic Services
    // We want to ensure specific mocks are ALWAYS available, even if Admin adds new ones.
    // We use a Map to Deduplicate by ID in case 'allServices' already contains the mocks (from context initialization).
    const optionsMap = new Map<string, BookingOption>();

    // Add Static Mocks first
    [
        ...MOCK_BUS_OPTIONS,
        ...MOCK_FLIGHT_OPTIONS,
        ...MOCK_APPOINTMENT_OPTIONS,
        ...MOCK_MOVIE_OPTIONS
    ].forEach(opt => optionsMap.set(opt.id, opt));

    // Add/Overwrite with Dynamic Services
    // This allows Admin to override a mock if they use the same ID (unlikely but good for flexibility)
    // or simply append new ones.
    allServices.forEach(opt => optionsMap.set(opt.id, opt));

    let validOptions = Array.from(optionsMap.values());

    // 2. Filter by Intent/Type
    // We map the broad intent (e.g., APPOINTMENT) to specific service types (e.g., appointment, doctor)
    if (type === "BUS_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'bus');
    } else if (type === "FLIGHT_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'flight');
    } else if (type === "MOVIE_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'movie');
    } else if (type === "APPOINTMENT") {
        // Allow 'appointment' OR 'doctor' for flexibility
        validOptions = validOptions.filter(o => o.type === 'appointment' || o.category === 'doctor');
    }

    // 3. Smart Matching with Synonyms and Specialty Recognition
    if (filterCategory) {
        // Specialty synonym map for better matching
        const specialtyMap: Record<string, string[]> = {
            'cardiologist': ['heart', 'cardiac', 'cardio', 'heart doctor', 'heart specialist'],
            'dentist': ['teeth', 'dental', 'tooth', 'oral', 'dental care'],
            'dermatologist': ['skin', 'skin doctor', 'derma', 'skin specialist'],
            'gynecologist': ['women', 'pregnancy', 'gyno', 'maternity', 'obs'],
            'urologist': ['kidney', 'bladder', 'urology', 'urinary'],
            'nephrologist': ['kidney', 'kidney specialist', 'nephro', 'renal'],
            'general': ['gp', 'physician', 'general doctor', 'family doctor'],
            'plumber': ['pipe', 'leak', 'water', 'plumbing', 'drainage'],
            'electrician': ['electricity', 'wiring', 'electric', 'power', 'light'],
            'salon': ['hair', 'haircut', 'beauty', 'grooming', 'barber'],
            'makeup': ['makeup artist', 'bridal', 'party makeup', 'mua'],
            'tailor': ['sewing', 'stitching', 'alteration', 'suit', 'clothes'],
        };

        // Normalize query and split into tokens
        const query = filterCategory.toLowerCase();
        const queryTokens = query.split(/\s+/).filter(t => t.length > 2);

        if (queryTokens.length > 0) {
            const scoredOptions = validOptions.map(opt => {
                let score = 0;

                const titleLower = opt.title.toLowerCase();
                const subtitleLower = opt.subtitle.toLowerCase();
                const categoryLower = opt.category?.toLowerCase() || '';
                const detailsText = Object.values(opt.details).join(' ').toLowerCase();

                // Check for exact specialty match in subtitle (HIGHEST PRIORITY)
                Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                    if (subtitleLower.includes(specialty)) {
                        // User query matches this specialty
                        if (queryTokens.some(token =>
                            specialty.includes(token) ||
                            synonyms.some(syn => syn.includes(token) || token.includes(syn))
                        )) {
                            score += 500; // Massive boost for specialty match
                        }
                    }
                });

                queryTokens.forEach(token => {
                    // Exact subtitle match (e.g., "Cardiologist")
                    if (subtitleLower === token) score += 200;
                    if (subtitleLower.includes(token)) score += 100;

                    // Category match
                    if (categoryLower === token) score += 80;
                    if (categoryLower.includes(token)) score += 40;

                    // Title match (doctor name)
                    if (titleLower.includes(token)) score += 30;

                    // Detail matches (lower priority)
                    if (detailsText.includes(token)) score += 10;

                    // Check synonyms
                    Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                        if (synonyms.some(syn => token.includes(syn) || syn.includes(token))) {
                            if (subtitleLower.includes(specialty) || categoryLower.includes(specialty)) {
                                score += 150; // Synonym match
                            }
                        }
                    });
                });

                return { opt, score };
            });

            // Filter out zero-score results and sort by relevance
            validOptions = scoredOptions
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(item => item.opt);
        }
    }

    // 4. Limit to top 5 most relevant results
    return validOptions.slice(0, 5);
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

const CASH_OPTION: BookingOption = {
    id: "payment_cash",
    type: "payment_cash",
    title: "Pay at Counter",
    subtitle: "Reserve now, pay later",
    price: 0,
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

    // Call AI
    const aiResponse = await getAgentResponse(userMessage, []);

    console.log("[Agent] AI Response:", aiResponse);

    let finalFilterCategory = aiResponse.filterCategory;

    // Smart extraction: If AI didn't provide filterCategory but mentioned a specialty
    if (!finalFilterCategory && aiResponse.content) {
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
                finalFilterCategory = specialty;
                console.log(`[Agent] Extracted specialty from content: ${specialty}`);
                break;
            }
        }
    }

    // Fetch options if needed
    let finalOptions: BookingOption[] | undefined;
    if (aiResponse.showOptions) {
        finalOptions = getOptionsByType(aiResponse.showOptions, finalFilterCategory, allServices);
        console.log(`[Agent] Filtered ${finalOptions.length} options for ${aiResponse.showOptions} with category ${finalFilterCategory || 'none'}`);
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
