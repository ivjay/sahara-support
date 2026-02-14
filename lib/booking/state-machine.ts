import { BookingWizardState, BookingAction, BookingStep, PassengerInfo } from './types';

// Step sequences for each service type
export const STEP_SEQUENCES: Record<string, BookingStep[]> = {
    movie: [
        'service_selected',
        'date_selection',
        'time_selection',
        'passenger_count',
        'seat_selection',
        'price_review',
        'payment',
        'confirmation'
    ],
    bus: [
        'service_selected',
        'date_selection',
        'passenger_count',
        'passenger_details',
        'seat_selection',
        'price_review',
        'payment',
        'confirmation'
    ],
    flight: [
        'service_selected',
        'date_selection',
        'passenger_count',
        'passenger_details',
        'seat_selection',
        'price_review',
        'payment',
        'confirmation'
    ],
    appointment: [
        'service_selected',
        'date_selection',
        'time_selection',
        'price_review',
        'payment',
        'confirmation'
    ]
};

export function createInitialState(
    serviceType: 'movie' | 'bus' | 'flight' | 'appointment',
    selectedService: any,
    sessionId: string
): BookingWizardState {
    return {
        serviceType,
        currentStep: 'service_selected',
        stepHistory: [],
        selectedService,
        venueId: selectedService.venueId,
        selectedDate: null,
        selectedTime: null,
        passengerCount: 1,
        passengers: [{ fullName: '' }],
        selectedSeats: [],
        seatReservationExpiry: null,
        basePrice: selectedService.price || 0,
        totalPrice: selectedService.price || 0,
        paymentMethod: null,
        sessionId,
        bookingId: null,
        errors: {},
        isProcessing: false
    };
}

function validateStep(state: BookingWizardState): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    switch (state.currentStep) {
        case 'date_selection':
            if (!state.selectedDate) errors.date = 'Please select a date';
            break;

        case 'time_selection':
            if (!state.selectedTime) errors.time = 'Please select a time';
            break;

        case 'passenger_count':
            if (state.passengerCount < 1) errors.count = 'At least 1 passenger required';
            if (state.passengerCount > 10) errors.count = 'Maximum 10 passengers';
            break;

        case 'passenger_details':
            state.passengers.forEach((p, i) => {
                if (!p.fullName?.trim()) {
                    errors[`passenger_${i}`] = `Passenger ${i + 1} name required`;
                }
            });
            break;

        case 'seat_selection':
            if (state.selectedSeats.length !== state.passengerCount) {
                errors.seats = `Select ${state.passengerCount} seat(s). Currently: ${state.selectedSeats.length}`;
            }
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
