/**
 * Receipt Generator Utility
 * Centralizes receipt data generation logic
 * Eliminates duplicate code across app/chat/page.tsx
 */

export interface ReceiptData {
    id: string;
    serviceName: string;
    location: string;
    date: string;
    time: string;
    price: number;
    status: "Confirmed" | "Pending" | "Under Review";
    userName: string;
    userPhone: string;
    timestamp: string;
    // Optional fields for detailed receipts
    seats?: string;
    passengers?: number;
    passengerNames?: string[];
    serviceType?: string;
    paymentMethod?: 'qr' | 'cash';
    qrCodeUrl?: string;
}

export interface SimpleBooking {
    id: string;
    title: string;
    subtitle?: string;
    date: Date;
    amount: number | string;
    type?: string;
    status?: string;
}

export interface DetailedBooking {
    id: string;
    title: string;
    subtitle?: string;
    date: Date;
    amount: number | string;
    type?: string;
    status?: string;
    details?: {
        time?: string;
        departure?: string;
        arrival?: string;
        duration?: string;
        from?: string;
        to?: string;
        seats?: string[];
        passengerCount?: number;
        passengers?: Array<{ fullName?: string; phone?: string; email?: string }>;
        hospital?: string;
        clinic?: string;
        theater?: string;
        cinema?: string;
        busType?: string;
        aircraft?: string;
        doctor?: string;
        paymentMethod?: 'qr' | 'cash';
        qrCodeUrl?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
}

export interface UserProfile {
    name?: string;
    phone?: string;
}

/**
 * Helper to parse amount which could be a number or a string (e.g. "NPR 1200")
 */
function parseAmount(amount: number | string): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    // Extract numbers from string like "NPR 1200" or "$ 50"
    const numericPart = amount.replace(/[^\d.]/g, '');
    return parseFloat(numericPart) || 0;
}

/**
 * Generate receipt data from a simple booking
 * Used for basic confirmations and admin verification notifications
 */
export function generateSimpleReceipt(
    booking: SimpleBooking,
    userProfile?: UserProfile
): ReceiptData {
    return {
        id: booking.id,
        serviceName: booking.title,
        location: booking.subtitle || '',
        date: booking.date.toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: parseAmount(booking.amount),
        status: "Confirmed",
        userName: userProfile?.name || "Guest",
        userPhone: userProfile?.phone || "N/A",
        timestamp: new Date().toISOString()
    };
}

/**
 * Generate detailed receipt data from a booking with full details
 * Used for wizard-based bookings with seats, passengers, etc.
 */
export function generateDetailedReceipt(
    booking: DetailedBooking,
    userProfile?: UserProfile
): ReceiptData {
    const details = booking.details || {};

    // Build location based on service type (CRITICAL INFO - MUST BE PRESENT)
    let location = '';

    // For buses and flights - MUST show route
    if (booking.type === 'bus' || booking.type === 'flight') {
        if (details.from && details.to) {
            location = `${String(details.from)} → ${String(details.to)}`;
        } else if (booking.subtitle && booking.subtitle.includes('→')) {
            location = booking.subtitle;
        } else {
            location = `Route not specified`;
        }
    }
    // For movies - MUST show cinema
    else if (booking.type === 'movie') {
        location = String(details.cinema || details.theater || booking.subtitle || 'Cinema not specified');
    }
    // For appointments - MUST show hospital/clinic
    else if (booking.type === 'appointment') {
        if (details.hospital) {
            location = `${String(details.hospital)}${details.address ? ', ' + String(details.address) : ''}`;
        } else {
            location = String(details.clinic || details.address || booking.subtitle || 'Hospital not specified');
        }
    }
    // Fallback
    else {
        location = String(booking.subtitle || details.location || 'Location not available');
    }

    // Build time string with departure/arrival info
    let timeString = String(details.time || details.departure || 'N/A');
    if (details.departure && details.arrival) {
        timeString = `${String(details.departure)} - ${String(details.arrival)}`;
    } else if (details.departure && details.duration) {
        timeString = `${String(details.departure)} (${String(details.duration)})`;
    }

    // Extract passenger info (names and phone)
    const passengers: Array<{ fullName?: string; phone?: string }> = Array.isArray(details.passengers) ? details.passengers : [];
    const passengerNames: string[] = passengers
        .map((p) => p.fullName)
        .filter((name): name is string => !!name);

    // Get phone from first passenger if userProfile doesn't have it
    const firstPassenger = passengers[0] || { fullName: undefined, phone: undefined };
    const userName = userProfile?.name || firstPassenger.fullName || passengerNames[0] || "Guest";
    const userPhone = userProfile?.phone || firstPassenger.phone || "N/A";

    return {
        id: booking.id,
        serviceName: booking.title,
        location,
        date: new Date(booking.date).toLocaleDateString(),
        time: timeString,
        seats: details.seats?.join(', '),
        passengers: details.passengerCount || 1,
        passengerNames: passengerNames.length > 0 ? passengerNames : undefined,
        serviceType: booking.type,
        price: parseAmount(booking.amount),
        status: (booking.status as "Confirmed" | "Pending" | "Under Review") || "Pending",
        userName,
        userPhone,
        timestamp: new Date().toISOString(),
        paymentMethod: details.paymentMethod,
        qrCodeUrl: details.qrCodeUrl
    };
}

/**
 * Auto-detect which receipt type to generate based on booking structure
 * Convenience wrapper that chooses between simple and detailed receipts
 */
export function generateReceiptFromBooking(
    booking: SimpleBooking | DetailedBooking,
    userProfile?: UserProfile
): ReceiptData {
    // Check if booking has detailed information
    const hasDetails = 'details' in booking && booking.details && Object.keys(booking.details).length > 0;

    if (hasDetails) {
        return generateDetailedReceipt(booking as DetailedBooking, userProfile);
    } else {
        return generateSimpleReceipt(booking, userProfile);
    }
}

/**
 * Generate receipt from booking ID and state
 * Helper for cases where you have bookingId and need to fetch booking
 */
export function generateReceiptFromId(
    bookingId: string,
    bookingTitle: string,
    bookingSubtitle: string,
    bookingDate: Date,
    bookingAmount: number,
    userProfile?: UserProfile
): ReceiptData {
    return generateSimpleReceipt(
        {
            id: bookingId,
            title: bookingTitle,
            subtitle: bookingSubtitle,
            date: bookingDate,
            amount: bookingAmount
        },
        userProfile
    );
}

/**
 * Format receipt status for display
 */
export function formatReceiptStatus(status: string): "Confirmed" | "Pending" | "Under Review" {
    const normalized = status.toLowerCase();
    if (normalized === 'confirmed' || normalized === 'paid' || normalized === 'completed') {
        return "Confirmed";
    }
    if (normalized === 'pending') {
        return "Pending";
    }
    return "Under Review";
}

/**
 * Get smart location label from booking details
 * Returns the most appropriate location string based on service type
 */
export function getSmartLocationLabel(booking: DetailedBooking): string {
    if (booking.subtitle) return booking.subtitle;
    if (!booking.details) return '';

    // Check all possible location fields
    const locations = [
        booking.details.hospital,
        booking.details.clinic,
        booking.details.theater,
        booking.details.to
    ];

    return locations.find(loc => loc) || 'See booking details';
}

/**
 * Get context-aware label for passengers/patients
 */
export function getPeopleLabelForService(serviceType?: string): string {
    return serviceType === 'appointment' ? 'Patient(s)' : 'Passengers';
}
