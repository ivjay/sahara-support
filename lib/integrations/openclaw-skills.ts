/**
 * OpenClaw Skills Integration
 * Maps OpenClaw skills to Sahara mock database
 * Handles service queries and booking status checks
 */

import { BookingOption } from '@/lib/chat/types';
import {
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
} from '@/lib/chat/mock-data';
import { db } from '@/lib/db/service';

/**
 * Check booking status by ID
 */
export async function checkBookingStatus(bookingId: string): Promise<string> {
    try {
        const booking = await db.getById(bookingId);

        if (!booking) {
            return `❌ Booking ID "${bookingId}" not found. Please check your booking ID and try again.`;
        }

        const statusEmoji = {
            'Confirmed': '✅',
            'Pending': '⏳',
            'Pending Payment': '💳',
            'Cancelled': '❌',
            'Completed': '✅',
        }[booking.status] || '❓';

        return `${statusEmoji} **Booking Status**

📋 Booking ID: ${booking.id}
🎫 Service: ${booking.title}
💰 Amount: ${booking.amount}
📅 Date: ${new Date(booking.date).toLocaleDateString()}
🔔 Status: ${booking.status}

${booking.status === 'Confirmed' ? '✅ Your booking is confirmed! See you there.' : ''}
${booking.status === 'Pending' ? '⏳ Your booking is pending confirmation. We will notify you shortly.' : ''}
${booking.status === 'Pending Payment' ? '💳 Please complete your payment to confirm the booking.' : ''}
${booking.status === 'Cancelled' ? '❌ This booking has been cancelled.' : ''}
${booking.status === 'Completed' ? '✅ This booking has been completed. Thank you!' : ''}`;
    } catch (error) {
        console.error('[Skills] Error checking booking status:', error);
        return '❌ Sorry, I could not retrieve your booking status. Please try again later.';
    }
}

/**
 * List service providers by category and location
 */
export function listServiceProviders(
    category: string,
    location?: string
): { message: string; options: BookingOption[] } {
    const lowerCategory = category.toLowerCase();

    // Filter appointments by category
    let filtered = MOCK_APPOINTMENT_OPTIONS.filter((opt) => {
        const optCategory = opt.category?.toLowerCase() || '';
        return optCategory.includes(lowerCategory) || opt.subtitle?.toLowerCase().includes(lowerCategory);
    });

    // Filter by location if provided
    if (location) {
        const lowerLocation = location.toLowerCase();
        filtered = filtered.filter((opt) => {
            const optLocation = opt.details?.hospital?.toLowerCase() || opt.details?.location?.toLowerCase() || '';
            return optLocation.includes(lowerLocation);
        });
    }

    if (filtered.length === 0) {
        return {
            message: `😔 Sorry, I couldn't find any ${category} providers${location ? ` in ${location}` : ''}.

Try:
- Different location (e.g., Kathmandu, Pokhara)
- Different service (e.g., doctor, dentist, salon)`,
            options: [],
        };
    }

    return {
        message: `🔍 Found ${filtered.length} ${category} provider(s)${location ? ` in ${location}` : ''}:`,
        options: filtered,
    };
}

/**
 * Query bus availability
 */
export function queryBusAvailability(
    from: string,
    to: string,
    date?: string
): { message: string; options: BookingOption[] } {
    const lowerFrom = from.toLowerCase();
    const lowerTo = to.toLowerCase();

    const filtered = MOCK_BUS_OPTIONS.filter((bus) => {
        const route = bus.subtitle?.toLowerCase() || '';
        // Match routes like "Kathmandu → Pokhara"
        return (
            (route.includes(lowerFrom) && route.includes(lowerTo)) ||
            (bus.details?.from?.toLowerCase().includes(lowerFrom) &&
                bus.details?.to?.toLowerCase().includes(lowerTo))
        );
    });

    if (filtered.length === 0) {
        return {
            message: `😔 Sorry, no buses found from ${from} to ${to}${date ? ` on ${date}` : ''}.

Available routes:
- Kathmandu ↔ Pokhara
- Kathmandu ↔ Chitwan
- Kathmandu ↔ Lumbini`,
            options: [],
        };
    }

    return {
        message: `🚌 Found ${filtered.length} bus option(s) from ${from} to ${to}${date ? ` on ${date}` : ''}:`,
        options: filtered,
    };
}

/**
 * Query flight availability
 */
export function queryFlightAvailability(
    from: string,
    to: string,
    date?: string
): { message: string; options: BookingOption[] } {
    const lowerFrom = from.toLowerCase();
    const lowerTo = to.toLowerCase();

    const filtered = MOCK_FLIGHT_OPTIONS.filter((flight) => {
        const route = flight.subtitle?.toLowerCase() || '';
        return (
            (route.includes(lowerFrom) && route.includes(lowerTo)) ||
            (flight.details?.from?.toLowerCase().includes(lowerFrom) &&
                flight.details?.to?.toLowerCase().includes(lowerTo))
        );
    });

    if (filtered.length === 0) {
        return {
            message: `😔 Sorry, no flights found from ${from} to ${to}${date ? ` on ${date}` : ''}.

Available routes:
- Kathmandu ↔ Pokhara
- Kathmandu ↔ Lukla
- Kathmandu ↔ Everest Base Camp (Helicopter)`,
            options: [],
        };
    }

    return {
        message: `✈️ Found ${filtered.length} flight option(s) from ${from} to ${to}${date ? ` on ${date}` : ''}:`,
        options: filtered,
    };
}

/**
 * List movies by city and date
 */
export function listMovies(
    city?: string,
    date?: string
): { message: string; options: BookingOption[] } {
    let filtered = MOCK_MOVIE_OPTIONS;

    if (city) {
        const lowerCity = city.toLowerCase();
        filtered = filtered.filter((movie) => {
            const location = movie.subtitle?.toLowerCase() || '';
            return location.includes(lowerCity);
        });
    }

    if (filtered.length === 0) {
        return {
            message: `😔 Sorry, no movies found${city ? ` in ${city}` : ''}${date ? ` on ${date}` : ''}.

Available cities:
- Kathmandu
- Pokhara`,
            options: [],
        };
    }

    return {
        message: `🎬 Found ${filtered.length} movie(s)${city ? ` in ${city}` : ''}${date ? ` on ${date}` : ''}:`,
        options: filtered,
    };
}

/**
 * Format options for Telegram display
 */
export function formatOptionsForTelegram(options: BookingOption[]): string {
    if (options.length === 0) {
        return 'No options available.';
    }

    return options
        .slice(0, 5) // Limit to 5 options for Telegram
        .map((opt, index) => {
            const details = Object.entries(opt.details || {})
                .map(([key, value]) => `  • ${key}: ${value}`)
                .join('\n');

            return `${index + 1}. **${opt.title}**
   ${opt.subtitle}
   💰 ${opt.currency} ${opt.price}
${details}`;
        })
        .join('\n\n');
}

export default {
    checkBookingStatus,
    listServiceProviders,
    queryBusAvailability,
    queryFlightAvailability,
    listMovies,
    formatOptionsForTelegram,
};
