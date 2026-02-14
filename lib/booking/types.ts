// ============================================
// BOOKING SYSTEM TYPES - MVP
// ============================================

export type BookingStep =
    | 'service_selected'
    | 'date_selection'
    | 'time_selection'
    | 'passenger_count'
    | 'passenger_details'
    | 'seat_selection'
    | 'price_review'
    | 'payment'
    | 'confirmation';

export type SeatStatus = 'available' | 'selected' | 'booked' | 'reserved';
export type SeatType = 'vip' | 'regular' | 'economy' | 'business' | 'window' | 'aisle';

export interface SeatInfo {
    label: string;              // "A3", "1A"
    type: SeatType;
    status: SeatStatus;
    price?: number;
}

export interface VenueRow {
    label: string;              // Row number/letter
    seats: (SeatInfo | null)[]; // null = aisle gap
}

export interface VenueConfig {
    id: string;
    name: string;
    venueType: 'cinema_hall' | 'bus' | 'flight';
    capacity: number;
    rows: VenueRow[];
}

export interface SeatInventoryItem {
    id: string;
    venueId: string;
    serviceId: string;
    eventDate: string;
    eventTime: string;
    seatLabel: string;
    seatType: SeatType;
    priceOverride?: number;
    status: SeatStatus;
    reservedBy?: string;
    reservedUntil?: string;
    bookedBy?: string;
}

export interface TimeSlot {
    time: string;               // "11:00"
    status: 'available' | 'reserved' | 'booked';
    formattedTime?: string;     // "11:00 AM"
}

export interface PassengerInfo {
    fullName: string;
    seatLabel?: string;
    phone?: string;
    email?: string;
}

export interface BookingWizardState {
    serviceType: 'movie' | 'bus' | 'flight' | 'appointment';
    currentStep: BookingStep;
    stepHistory: BookingStep[];

    // Service info
    selectedService: any;       // BookingOption from existing types
    venueId?: string;

    // Date/Time
    selectedDate: string | null;
    selectedTime: string | null;

    // Passengers
    passengerCount: number;
    passengers: PassengerInfo[];

    // Seats
    selectedSeats: string[];
    seatReservationExpiry: Date | null;

    // Pricing
    basePrice: number;
    totalPrice: number;

    // Payment
    paymentMethod: 'qr' | 'cash' | null;

    // Meta
    sessionId: string;
    bookingId: string | null;
    errors: Record<string, string>;
    isProcessing: boolean;
}

export type BookingAction =
    | { type: 'SELECT_DATE'; date: string }
    | { type: 'SELECT_TIME'; time: string }
    | { type: 'SET_PASSENGER_COUNT'; count: number }
    | { type: 'UPDATE_PASSENGER'; index: number; info: PassengerInfo }
    | { type: 'SELECT_SEATS'; seats: string[] }
    | { type: 'RESERVE_SEATS_SUCCESS'; expiry: Date }
    | { type: 'RESERVE_SEATS_FAILURE'; failedSeats: string[] }
    | { type: 'GO_NEXT' }
    | { type: 'GO_BACK' }
    | { type: 'GO_TO_STEP'; step: BookingStep }
    | { type: 'SELECT_PAYMENT'; method: 'qr' | 'cash' }
    | { type: 'SET_ERROR'; field: string; message: string }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'SET_PROCESSING'; value: boolean }
    | { type: 'RESERVATION_EXPIRED' }
    | { type: 'BOOKING_COMPLETE'; bookingId: string };

export interface ReservationResult {
    success: boolean;
    failedSeats?: string[];
    expiry?: Date;
    message?: string;
}
