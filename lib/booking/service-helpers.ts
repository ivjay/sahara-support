/**
 * Service Helpers Utility
 * Centralizes service-type-specific logic and labels
 * Eliminates hardcoded checks across multiple files
 */

export type ServiceType = 'movie' | 'bus' | 'appointment' | 'flight' | 'other';

/**
 * Get the appropriate label for passengers/patients based on service type
 * @param serviceType - Type of service
 * @param plural - Return plural form if true
 * @returns Label for people in this service (e.g., "Patient", "Passenger")
 */
export function getServicePassengerLabel(
    serviceType?: string,
    plural: boolean = false
): string {
    const type = (serviceType || '').toLowerCase();

    if (type === 'appointment') {
        return plural ? 'Patients' : 'Patient';
    }

    // Default for bus, movie, flight, other
    return plural ? 'Passengers' : 'Passenger';
}

/**
 * Get check-in time in minutes before event based on service type
 * @param serviceType - Type of service
 * @returns Number of minutes to arrive early
 */
export function getServiceCheckInTime(serviceType?: string): number {
    const type = (serviceType || '').toLowerCase();

    switch (type) {
        case 'appointment':
            return 10; // Arrive 10 minutes early for appointments
        case 'movie':
            return 15; // Arrive 15 minutes early for movies
        case 'flight':
            return 120; // Arrive 2 hours early for flights
        case 'bus':
        default:
            return 30; // Default: 30 minutes for buses and others
    }
}

/**
 * Get reminder hours before event based on service type
 * Used for the urgent pre-departure reminder
 * @param serviceType - Type of service
 * @returns Number of hours before to send urgent reminder
 */
export function getServiceReminderHours(serviceType?: string): number {
    const type = (serviceType || '').toLowerCase();

    if (type === 'flight') {
        return 3; // 3-hour reminder for flights
    }

    // Default: 1-hour reminder for all other services
    return 1;
}

/**
 * Get the appropriate icon emoji for a service type
 * @param serviceType - Type of service
 * @returns Emoji representing the service
 */
export function getServiceIcon(serviceType?: string): string {
    const type = (serviceType || '').toLowerCase();

    const iconMap: Record<string, string> = {
        movie: '🎬',
        bus: '🚌',
        appointment: '🏥',
        flight: '✈️',
        train: '🚂',
        event: '🎫',
        restaurant: '🍽️',
        hotel: '🏨'
    };

    return iconMap[type] || '📋';
}

/**
 * Get human-readable service type label
 * @param serviceType - Type of service
 * @returns Capitalized, readable label
 */
export function getServiceTypeLabel(serviceType?: string): string {
    const type = (serviceType || '').toLowerCase();

    const labelMap: Record<string, string> = {
        movie: 'Movie',
        bus: 'Bus Ticket',
        appointment: 'Appointment',
        flight: 'Flight',
        train: 'Train Ticket',
        event: 'Event Ticket',
        restaurant: 'Restaurant Reservation',
        hotel: 'Hotel Booking'
    };

    return labelMap[type] || 'Service';
}

/**
 * Check if a service type requires seat selection
 * @param serviceType - Type of service
 * @returns True if service uses seat selection
 */
export function requiresSeatSelection(serviceType?: string): boolean {
    const type = (serviceType || '').toLowerCase();
    return ['movie', 'bus', 'flight', 'train', 'event'].includes(type);
}

/**
 * Check if a service type requires time specification
 * @param serviceType - Type of service
 * @returns True if service needs specific time
 */
export function requiresTimeSelection(serviceType?: string): boolean {
    const type = (serviceType || '').toLowerCase();
    return ['movie', 'flight', 'appointment', 'restaurant', 'event'].includes(type);
}

/**
 * Check if a service type typically requires admin verification
 * @param serviceType - Type of service
 * @returns True if service usually needs admin approval
 */
export function requiresAdminVerification(serviceType?: string): boolean {
    const type = (serviceType || '').toLowerCase();
    // Bus tickets often require manual verification in some systems
    return type === 'bus';
}

/**
 * Get the default payment method for a service type
 * @param serviceType - Type of service
 * @returns Suggested payment method
 */
export function getDefaultPaymentMethod(serviceType?: string): 'qr' | 'cash' | 'card' {
    const type = (serviceType || '').toLowerCase();

    // Movies and events often support online payment
    if (['movie', 'event', 'flight'].includes(type)) {
        return 'qr';
    }

    // Appointments and restaurants may prefer cash
    if (['appointment', 'restaurant'].includes(type)) {
        return 'cash';
    }

    // Default to QR code
    return 'qr';
}

/**
 * Get the cancellation window in hours for a service type
 * How many hours before the event can be cancelled
 * @param serviceType - Type of service
 * @returns Number of hours before event that cancellation is allowed
 */
export function getCancellationWindowHours(serviceType?: string): number {
    const type = (serviceType || '').toLowerCase();

    switch (type) {
        case 'flight':
            return 24; // Can cancel up to 24h before
        case 'movie':
        case 'event':
            return 2; // Can cancel up to 2h before
        case 'bus':
            return 6; // Can cancel up to 6h before
        case 'appointment':
            return 12; // Can cancel up to 12h before
        default:
            return 6; // Default: 6 hours
    }
}

/**
 * Get refund percentage based on cancellation timing
 * @param serviceType - Type of service
 * @param hoursBeforeEvent - How many hours before the event
 * @returns Refund percentage (0-100)
 */
export function getRefundPercentage(
    serviceType: string,
    hoursBeforeEvent: number
): number {
    const type = serviceType.toLowerCase();
    const cancellationWindow = getCancellationWindowHours(type);

    if (hoursBeforeEvent >= cancellationWindow) {
        return 100; // Full refund
    } else if (hoursBeforeEvent >= cancellationWindow / 2) {
        return 50; // 50% refund
    } else {
        return 0; // No refund
    }
}

/**
 * Format service-specific location/destination label
 * @param serviceType - Type of service
 * @param location - Location string
 * @returns Formatted label (e.g., "To Pokhara" for bus, "At Grand Cinema" for movie)
 */
export function formatServiceLocation(
    serviceType?: string,
    location?: string
): string {
    if (!location) return '';

    const type = (serviceType || '').toLowerCase();

    if (type === 'bus' || type === 'flight' || type === 'train') {
        return `To ${location}`;
    }

    if (type === 'movie' || type === 'event') {
        return `At ${location}`;
    }

    if (type === 'appointment') {
        return location; // Just show the hospital/clinic name
    }

    return location;
}

/**
 * Get context-aware verb for booking action
 * @param serviceType - Type of service
 * @returns Verb like "Book", "Reserve", "Schedule"
 */
export function getBookingActionVerb(serviceType?: string): string {
    const type = (serviceType || '').toLowerCase();

    if (type === 'appointment') {
        return 'Schedule';
    }

    if (type === 'restaurant' || type === 'hotel') {
        return 'Reserve';
    }

    // Default for movie, bus, flight, event
    return 'Book';
}

/**
 * Validate if passenger details are required for this service type
 * @param serviceType - Type of service
 * @returns True if passenger details must be collected
 */
export function requiresPassengerDetails(serviceType?: string): boolean {
    const type = (serviceType || '').toLowerCase();
    // All services need at least basic passenger info
    return true;
}

/**
 * Get the minimum number of passengers/patients allowed
 * @param serviceType - Type of service
 * @returns Minimum count
 */
export function getMinPassengerCount(serviceType?: string): number {
    // All services require at least 1 passenger/patient
    return 1;
}

/**
 * Get the maximum number of passengers/patients allowed in single booking
 * @param serviceType - Type of service
 * @returns Maximum count
 */
export function getMaxPassengerCount(serviceType?: string): number {
    const type = (serviceType || '').toLowerCase();

    if (type === 'appointment') {
        return 3; // Max 3 patients per appointment
    }

    if (type === 'restaurant') {
        return 12; // Max 12 people for restaurant
    }

    // Default for bus, flight, movie: 10 passengers
    return 10;
}
