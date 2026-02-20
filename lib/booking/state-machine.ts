import { BookingWizardState, BookingAction, BookingStep, PassengerInfo } from './types';

// Simplified step sequences - reduced from 8 to 3-4 steps
export const STEP_SEQUENCES: Record<string, BookingStep[]> = {
    movie: [
        'date_selection',      // Date & Time combined
        'seat_selection',      // Seats & Passenger details combined
        'payment',             // Review + Payment combined
        'confirmation'
    ],
    bus: [
        'date_selection',      // Date selection only (no time needed)
        'seat_selection',      // Seats & Passenger details combined
        'payment',             // Review + Payment combined
        'confirmation'
    ],
    flight: [
        'date_selection',      // Date selection only
        'seat_selection',      // Seats & Passenger details combined
        'payment',             // Review + Payment combined
        'confirmation'
    ],
    appointment: [
        'date_selection',      // Date & Time combined
        'passenger_details',   // Just patient details (no seats)
        'payment',             // Review + Payment combined
        'confirmation'
    ]
};

export function createInitialState(
    serviceType: 'movie' | 'bus' | 'flight' | 'appointment',
    selectedService: Record<string, unknown>,
    sessionId: string
): BookingWizardState {
    return {
        serviceType,
        currentStep: 'service_selected',
        stepHistory: [],
        selectedService,
        venueId: selectedService.venueId as string | undefined,
        selectedDate: null,
        selectedTime: null,
        passengerCount: 1,
        passengers: [{ fullName: '' }],
        selectedSeats: [],
        seatReservationExpiry: null,
        basePrice: (selectedService.price as number) || 0,
        totalPrice: (selectedService.price as number) || 0,
        paymentMethod: null,
        sessionId,
        bookingId: null,
        errors: {},
        isProcessing: false
    };
}

function validateStep(state: BookingWizardState): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const needsTime = state.serviceType === 'movie' || state.serviceType === 'appointment';

    switch (state.currentStep) {
        case 'date_selection':
            if (!state.selectedDate) errors.date = 'Please select a date';
            if (needsTime && !state.selectedTime) errors.time = 'Please select a time';
            break;

        case 'passenger_details':
            // Validate at least first passenger has name
            if (!state.passengers[0]?.fullName?.trim()) {
                errors.passenger = 'Please enter passenger name';
            }
            break;

        case 'seat_selection':
            // Validate passenger count
            if (state.passengerCount < 1) {
                errors.count = 'At least 1 passenger required';
            }
            // Validate seats selected
            if (state.selectedSeats.length !== state.passengerCount) {
                errors.seats = `Select ${state.passengerCount} seat(s). Currently selected: ${state.selectedSeats.length}`;
            }
            // Validate passenger details
            state.passengers.forEach((p, i) => {
                if (i < state.passengerCount && !p.fullName?.trim()) {
                    errors[`passenger_${i}`] = `Passenger ${i + 1} name required`;
                }
            });
            break;

        case 'payment':
            // Payment step handles its own validation
            break;
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

function recalculateTotal(state: BookingWizardState): number {
    return state.basePrice * state.passengerCount;
}

export function bookingWizardReducer(
    state: BookingWizardState,
    action: BookingAction
): BookingWizardState {
    const steps = STEP_SEQUENCES[state.serviceType];
    const currentIndex = steps.indexOf(state.currentStep);

    switch (action.type) {
        case 'GO_NEXT': {
            const validation = validateStep(state);
            if (!validation.valid) {
                return { ...state, errors: validation.errors };
            }

            const nextIndex = currentIndex + 1;
            if (nextIndex >= steps.length) return state;

            return {
                ...state,
                currentStep: steps[nextIndex],
                stepHistory: [...state.stepHistory, state.currentStep],
                errors: {}
            };
        }

        case 'GO_BACK': {
            if (state.stepHistory.length === 0) return state;
            const prevStep = state.stepHistory[state.stepHistory.length - 1];
            return {
                ...state,
                currentStep: prevStep,
                stepHistory: state.stepHistory.slice(0, -1),
                errors: {}
            };
        }

        case 'GO_TO_STEP': {
            return {
                ...state,
                currentStep: action.step,
                errors: {}
            };
        }

        case 'SELECT_DATE': {
            return {
                ...state,
                selectedDate: action.date,
                errors: {}
            };
        }

        case 'SELECT_TIME': {
            return {
                ...state,
                selectedTime: action.time,
                errors: {}
            };
        }

        case 'SET_PASSENGER_COUNT': {
            const newPassengers = Array(action.count)
                .fill(null)
                .map((_, i) => state.passengers[i] || { fullName: '' });

            return {
                ...state,
                passengerCount: action.count,
                passengers: newPassengers,
                selectedSeats: state.selectedSeats.slice(0, action.count),
                totalPrice: recalculateTotal({ ...state, passengerCount: action.count })
            };
        }

        case 'UPDATE_PASSENGER': {
            const newPassengers = [...state.passengers];
            newPassengers[action.index] = action.info;
            return {
                ...state,
                passengers: newPassengers
            };
        }

        case 'SELECT_SEATS': {
            return {
                ...state,
                selectedSeats: action.seats
            };
        }

        case 'RESERVE_SEATS_SUCCESS': {
            return {
                ...state,
                seatReservationExpiry: action.expiry,
                errors: {}
            };
        }

        case 'RESERVE_SEATS_FAILURE': {
            return {
                ...state,
                selectedSeats: state.selectedSeats.filter(s => !action.failedSeats.includes(s)),
                errors: {
                    seats: `Failed to reserve: ${action.failedSeats.join(', ')}`
                }
            };
        }

        case 'RESERVATION_EXPIRED': {
            return {
                ...state,
                selectedSeats: [],
                seatReservationExpiry: null,
                currentStep: 'seat_selection',
                errors: {
                    seats: 'Reservation expired. Please select seats again.'
                }
            };
        }

        case 'SELECT_PAYMENT': {
            return {
                ...state,
                paymentMethod: action.method
            };
        }

        case 'SET_ERROR': {
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.field]: action.message
                }
            };
        }

        case 'CLEAR_ERRORS': {
            return {
                ...state,
                errors: {}
            };
        }

        case 'SET_PROCESSING': {
            return {
                ...state,
                isProcessing: action.value
            };
        }

        case 'BOOKING_COMPLETE': {
            return {
                ...state,
                bookingId: action.bookingId,
                currentStep: 'confirmation',
                isProcessing: false
            };
        }

        default:
            return state;
    }
}
