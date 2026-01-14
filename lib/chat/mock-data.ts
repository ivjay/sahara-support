import { BookingOption, Intent } from "./types";

// Welcome message
export const WELCOME_MESSAGE = `Hi! 👋 I'm Sahara, your support assistant.

I can help you with:
• 🚌 Bus ticket booking
• ✈️ Flight reservations
• 🏥 Doctor appointments
• 🎬 Movie tickets

How can I help you today?`;

// Quick action suggestions
export const QUICK_ACTIONS = [
    "Book a bus ticket",
    "Find flights",
    "Schedule an appointment",
    "Book movie tickets",
];

// Intent detection keywords
export const INTENT_KEYWORDS: Record<Intent, string[]> = {
    GREETING: ["hi", "hello", "hey", "good morning", "good evening", "namaste"],
    BUS_BOOKING: ["bus", "bus ticket", "travel by bus", "book bus"],
    FLIGHT_BOOKING: ["flight", "fly", "airplane", "air ticket", "book flight"],
    APPOINTMENT: ["appointment", "doctor", "hospital", "clinic", "checkup", "medical"],
    MOVIE_BOOKING: ["movie", "cinema", "film", "theater", "show", "watch movie"],
    GENERAL_QUERY: ["help", "what can you do", "services", "options"],
    UNKNOWN: [],
};

// Mock bus options
export const MOCK_BUS_OPTIONS: BookingOption[] = [
    {
        id: "bus-1",
        type: "bus",
        title: "Deluxe Express",
        subtitle: "Kathmandu → Pokhara",
        price: 1200,
        currency: "NPR",
        details: {
            departure: "6:00 AM",
            arrival: "1:00 PM",
            duration: "7 hours",
            busType: "AC Deluxe",
            seats: "12 available",
        },
        available: true,
    },
    {
        id: "bus-2",
        type: "bus",
        title: "Tourist Coach",
        subtitle: "Kathmandu → Pokhara",
        price: 1500,
        currency: "NPR",
        details: {
            departure: "7:30 AM",
            arrival: "2:00 PM",
            duration: "6.5 hours",
            busType: "Tourist Deluxe",
            seats: "8 available",
        },
        available: true,
    },
    {
        id: "bus-3",
        type: "bus",
        title: "Night Sleeper",
        subtitle: "Kathmandu → Pokhara",
        price: 1800,
        currency: "NPR",
        details: {
            departure: "8:00 PM",
            arrival: "4:00 AM",
            duration: "8 hours",
            busType: "Sleeper Bus",
            seats: "5 available",
        },
        available: true,
    },
];

// Mock flight options
export const MOCK_FLIGHT_OPTIONS: BookingOption[] = [
    {
        id: "flight-1",
        type: "flight",
        title: "Buddha Air",
        subtitle: "Kathmandu → Pokhara",
        price: 4500,
        currency: "NPR",
        details: {
            departure: "8:00 AM",
            arrival: "8:25 AM",
            duration: "25 min",
            aircraft: "ATR 72-500",
            class: "Economy",
        },
        available: true,
    },
    {
        id: "flight-2",
        type: "flight",
        title: "Yeti Airlines",
        subtitle: "Kathmandu → Pokhara",
        price: 4200,
        currency: "NPR",
        details: {
            departure: "10:30 AM",
            arrival: "10:55 AM",
            duration: "25 min",
            aircraft: "Jetstream 41",
            class: "Economy",
        },
        available: true,
    },
];

// Mock appointment options
export const MOCK_APPOINTMENT_OPTIONS: BookingOption[] = [
    {
        id: "apt-1",
        type: "appointment",
        title: "Dr. Sharma",
        subtitle: "General Physician",
        price: 500,
        currency: "NPR",
        details: {
            hospital: "City Hospital",
            experience: "15 years",
            availability: "Mon-Fri",
            nextSlot: "Tomorrow 10:00 AM",
        },
        available: true,
    },
    {
        id: "apt-2",
        type: "appointment",
        title: "Dr. Thapa",
        subtitle: "Cardiologist",
        price: 1500,
        currency: "NPR",
        details: {
            hospital: "Heart Care Center",
            experience: "20 years",
            availability: "Tue, Thu, Sat",
            nextSlot: "Thursday 2:00 PM",
        },
        available: true,
    },
];

// Mock movie options
export const MOCK_MOVIE_OPTIONS: BookingOption[] = [
    {
        id: "movie-1",
        type: "movie",
        title: "Kabaddi 5",
        subtitle: "QFX Cinemas, Labim Mall",
        price: 400,
        currency: "NPR",
        details: {
            showtime: "4:30 PM",
            language: "Nepali",
            format: "2D",
            rating: "⭐ 4.5/5",
        },
        available: true,
    },
    {
        id: "movie-2",
        type: "movie",
        title: "Avengers: Secret Wars",
        subtitle: "Big Movies, Civil Mall",
        price: 600,
        currency: "NPR",
        details: {
            showtime: "7:00 PM",
            language: "English",
            format: "3D IMAX",
            rating: "⭐ 4.8/5",
        },
        available: true,
    },
];

// Response templates
export const RESPONSE_TEMPLATES = {
    GREETING: "Hello! How can I assist you today?",
    BUS_BOOKING_START: "I'd be happy to help you book a bus ticket! Let me ask a few questions.",
    FLIGHT_BOOKING_START: "Great! Let's find you the perfect flight. I'll need some details.",
    APPOINTMENT_START: "I can help you schedule an appointment. Let me gather some information.",
    MOVIE_BOOKING_START: "Let's get you some movie tickets! I just need a few details.",
    OPTIONS_FOUND: "Here are the available options I found for you:",
    NO_OPTIONS: "I couldn't find any options matching your criteria. Would you like to try different dates or preferences?",
    BOOKING_COMPLETE: "Great choice! I've noted your selection. Would you like to proceed with the booking?",
    UNKNOWN: "I'm not sure I understood that. Could you please rephrase or choose from the options I can help with?",
};
