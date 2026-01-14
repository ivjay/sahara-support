import { BookingOption, Intent } from "./types";

// Welcome message
export const WELCOME_MESSAGE = `Hello! 👋 I'm **Sahara**, your AI assistant.

I can help you with:

• 🚌 **Bus Tickets** - Find and book bus rides
• ✈️ **Flights** - Search available flights
• 🏥 **Appointments** - Schedule doctor visits
• 🎬 **Movies** - Book cinema tickets

What would you like to do today?`;

// Quick action suggestions
export const QUICK_ACTIONS = [
    "Book a bus ticket",
    "Find flights",
    "Doctor appointment",
    "Movie tickets",
];

// Intent detection keywords
export const INTENT_KEYWORDS: Record<Intent, string[]> = {
    GREETING: ["hi", "hello", "hey", "good morning", "good evening", "namaste", "hola"],
    BUS_BOOKING: ["bus", "bus ticket", "travel by bus", "book bus", "bus to", "bus ride"],
    FLIGHT_BOOKING: ["flight", "fly", "airplane", "air ticket", "book flight", "flights to", "plane"],
    APPOINTMENT: ["appointment", "doctor", "hospital", "clinic", "checkup", "medical", "schedule"],
    MOVIE_BOOKING: ["movie", "cinema", "film", "theater", "show", "watch movie", "tickets"],
    GENERAL_QUERY: ["help", "what can you do", "services", "options", "menu", "back to menu"],
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
            nextSlot: "Tomorrow 10:00 AM",
            rating: "⭐ 4.8",
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
            nextSlot: "Thursday 2:00 PM",
            rating: "⭐ 4.9",
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
            rating: "⭐ 4.5",
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
            rating: "⭐ 4.8",
        },
        available: true,
    },
];

// Response templates (kept for reference but not heavily used now)
export const RESPONSE_TEMPLATES = {
    GREETING: "Hello! How can I assist you today?",
    BUS_BOOKING_START: "I'd be happy to help you book a bus ticket!",
    FLIGHT_BOOKING_START: "Great! Let's find you the perfect flight.",
    APPOINTMENT_START: "I can help you schedule an appointment.",
    MOVIE_BOOKING_START: "Let's get you some movie tickets!",
    OPTIONS_FOUND: "Here are the available options:",
    NO_OPTIONS: "I couldn't find any options matching your criteria.",
    BOOKING_COMPLETE: "Your booking is confirmed!",
    UNKNOWN: "I'm not sure I understood that. Could you please rephrase?",
};
