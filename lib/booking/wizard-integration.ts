import type { BookingOption } from '@/lib/chat/types';

// Helper to determine if a service needs the booking wizard
export function needsWizard(service: BookingOption): boolean {
    // Services with venue IDs need seat selection
    if (service.venueId) return true;

    // Movies, buses, flights always need wizard
    if (['movie', 'bus', 'flight'].includes(service.type)) return true;

    // Appointments need wizard for time slots
    if (service.type === 'appointment') return true;

    return false;
}

// Helper to determine service type from booking option
export function getServiceType(service: BookingOption): 'movie' | 'bus' | 'flight' | 'appointment' {
    if (service.type === 'movie') return 'movie';
    if (service.type === 'bus') return 'bus';
    if (service.type === 'flight') return 'flight';
    return 'appointment';
}

// Generate session ID for seat reservations
export function generateSessionId(): string {
    return `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}
