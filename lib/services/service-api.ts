import { BookingOption } from "@/lib/chat/types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
} from "@/lib/chat/mock-data";

/**
 * Get ALL services - both mocks and admin-created
 */
export async function getAllServices(): Promise<BookingOption[]> {
    const services: BookingOption[] = [];

    // Add all mock data
    services.push(...MOCK_BUS_OPTIONS);
    services.push(...MOCK_FLIGHT_OPTIONS);
    services.push(...MOCK_APPOINTMENT_OPTIONS);
    services.push(...MOCK_MOVIE_OPTIONS);

    // Try to fetch admin-created services from context
    // If running server-side, we can't access React context
    // So we'll just return mocks for now
    // The client-side code will merge them

    console.log(`[ServiceAPI] Returning ${services.length} mock services`);
    return services;
}