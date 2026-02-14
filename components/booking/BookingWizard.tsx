"use client";

import { useReducer, useEffect } from "react";
import { BookingWizardState, BookingStep } from "@/lib/booking/types";
import { bookingWizardReducer, createInitialState, STEP_SEQUENCES } from "@/lib/booking/state-machine";
import { StepIndicator } from "./StepIndicator";
import { ServiceShowcase } from "./steps/ServiceShowcase";
import { DateTimePicker } from "./steps/DateTimePicker";
import { PassengerCounter } from "./steps/PassengerCounter";
import { PassengerDetails } from "./steps/PassengerDetails";
import { SeatSelection } from "./steps/SeatSelection";
import { PriceSummary } from "./steps/PriceSummary";
import { PaymentStep } from "./steps/PaymentStep";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Calendar as CalendarIcon, Clock, Users, MapPin } from "lucide-react";

interface BookingWizardProps {
    serviceType: 'movie' | 'bus' | 'flight' | 'appointment';
    selectedService: any;
    sessionId: string;
    onComplete: (bookingId: string) => void;
    onCancel: () => void;
    userProfile?: {
        name?: string;
        phone?: string;
        email?: string;
    };
}

export function BookingWizard({
    serviceType,
    selectedService,
    sessionId,
    onComplete,
    onCancel,
    userProfile
}: BookingWizardProps) {
    const [state, dispatch] = useReducer(
        bookingWizardReducer,
        createInitialState(serviceType, selectedService, sessionId)
    );

    const steps = STEP_SEQUENCES[serviceType];
    const stepLabels: Record<BookingStep, string> = {
        'service_selected': 'Service',
        'date_selection': 'Date',
        'time_selection': 'Time',
        'passenger_count': 'Passengers',
        'passenger_details': 'Details',
        'seat_selection': 'Seats',
        'price_review': 'Review',
        'payment': 'Payment',
        'confirmation': 'Done'
    };

    const stepDefs = steps.map(id => ({ id, label: stepLabels[id] }));

    function renderCurrentStep() {
        switch (state.currentStep) {
            case 'service_selected':
                return (
                    <ServiceShowcase
                        service={selectedService}
                        serviceType={serviceType}
                    />
                );

            case 'date_selection':
            case 'time_selection':
                return (
                    <DateTimePicker
                        serviceType={serviceType}
                        serviceId={selectedService.id}
                        selectedDate={state.selectedDate}
                        selectedTime={state.selectedTime}
                        onDateChange={(date) => dispatch({ type: 'SELECT_DATE', date })}
                        onTimeChange={(time) => dispatch({ type: 'SELECT_TIME', time })}
                        needsTime={serviceType === 'movie' || serviceType === 'appointment'}
                    />
                );

            case 'passenger_count':
                return (
                    <PassengerCounter
                        count={state.passengerCount}
                        onChange={(count) => dispatch({ type: 'SET_PASSENGER_COUNT', count })}
                    />
                );

            case 'passenger_details':
                return (
                    <PassengerDetails
                        passengers={state.passengers}
                        onChange={(index, info) => dispatch({ type: 'UPDATE_PASSENGER', index, info })}
                        userProfile={userProfile}
                    />
                );

            case 'seat_selection':
                return (
                    <SeatSelection
                        venueId={selectedService.venueId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}
                        serviceId={selectedService.id}
                        eventDate={state.selectedDate!}
                        eventTime={state.selectedTime!}
                        maxSelectable={state.passengerCount}
                        selectedSeats={state.selectedSeats}
                        sessionId={sessionId}
                        onSeatsChange={(seats) => dispatch({ type: 'SELECT_SEATS', seats })}
                        onReserveSuccess={(expiry) => dispatch({ type: 'RESERVE_SEATS_SUCCESS', expiry })}
                        onReserveFailure={(failed) => dispatch({ type: 'RESERVE_SEATS_FAILURE', failedSeats: failed })}
                    />
                );

            case 'price_review':
                return (
                    <PriceSummary
                        service={selectedService}
                        passengerCount={state.passengerCount}
                        selectedSeats={state.selectedSeats}
                        totalPrice={state.totalPrice}
                        selectedDate={state.selectedDate || undefined}
                        selectedTime={state.selectedTime || undefined}
                    />
                );

            case 'payment':
                return (
                    <PaymentStep
                        totalPrice={state.totalPrice}
                        currency="NPR"
                        onPaymentSelect={(method) => dispatch({ type: 'SELECT_PAYMENT', method })}
                        onComplete={(bookingId) => dispatch({ type: 'BOOKING_COMPLETE', bookingId })}
                        bookingData={{
                            serviceId: selectedService.id,
                            serviceType,
                            serviceTitle: selectedService.title,
                            serviceSubtitle: selectedService.subtitle,
                            date: state.selectedDate!,
                            time: state.selectedTime!,
                            passengers: state.passengers,
                            seats: state.selectedSeats
                        }}
                    />
                );

            case 'confirmation':
                return (
                    <div className="text-center py-8 space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-pop-in">
                            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" strokeWidth={2} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-gradient">Booking Confirmed</h2>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">Your booking has been successfully confirmed. Details have been sent to your contact information.</p>

                        {/* Complete Booking Summary */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 rounded-2xl p-6 max-w-md mx-auto text-left shadow-sm">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-200 dark:border-green-800/50">
                                <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-500" />
                                <h3 className="font-bold text-lg">Booking Details</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Booking ID:</span>
                                    <span className="font-bold text-primary">{state.bookingId}</span>
                                </div>

                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Service:</span>
                                    <span className="font-semibold">{selectedService.title}</span>
                                </div>

                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Location:</span>
                                    <span className="font-medium">{selectedService.subtitle}</span>
                                </div>

                                {state.selectedDate && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Date:</span>
                                        <span className="font-medium">
                                            {new Date(state.selectedDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}

                                {state.selectedTime && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Time:</span>
                                        <span className="font-medium">{state.selectedTime}</span>
                                    </div>
                                )}

                                {state.selectedSeats.length > 0 && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Seats:</span>
                                        <span className="font-medium">{state.selectedSeats.join(', ')}</span>
                                    </div>
                                )}

                                {state.passengerCount > 0 && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Passengers:</span>
                                        <span className="font-medium">{state.passengerCount} {state.passengerCount === 1 ? 'person' : 'people'}</span>
                                    </div>
                                )}

                                {state.passengers.length > 0 && state.passengers[0].fullName && (
                                    <div className="border-b pb-2">
                                        <span className="text-gray-600 block mb-1">Passenger Names:</span>
                                        <div className="text-sm space-y-1 ml-2">
                                            {state.passengers.map((p, idx) => (
                                                <div key={idx} className="font-medium">
                                                    {idx + 1}. {p.fullName}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between pt-2">
                                    <span className="text-gray-600 font-semibold">Total Amount:</span>
                                    <span className="font-bold text-xl text-green-600">NPR {state.totalPrice}</span>
                                </div>
                            </div>
                        </div>

                        {/* Arrival Instructions */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 max-w-md mx-auto shadow-sm">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">Important Reminder</h4>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                        Please arrive{' '}
                                        <strong>
                                            {serviceType === 'movie' ? '15 minutes' :
                                             serviceType === 'bus' || serviceType === 'flight' ? '30 minutes' :
                                             '10 minutes'}
                                        </strong>{' '}
                                        before your scheduled time.
                                        {state.passengers[0]?.phone && (
                                            <> We'll send a reminder to {state.passengers[0].phone}.</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            {state.paymentMethod === 'qr' ? (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span>Payment verification pending. Check your chat for updates.</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    <span>Remember to bring payment on arrival.</span>
                                </>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    }

    const canGoNext = state.currentStep !== 'confirmation' && state.currentStep !== 'payment';
    const canGoBack = state.stepHistory.length > 0 && state.currentStep !== 'confirmation';

    return (
        <Card className="p-4 sm:p-6 w-full max-h-[95vh] overflow-y-auto">
            <StepIndicator steps={stepDefs} currentStep={state.currentStep} />

            <div className="my-8">
                {Object.keys(state.errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
                        {Object.values(state.errors)[0]}
                    </div>
                )}

                {renderCurrentStep()}
            </div>

            <div className="flex justify-between mt-6">
                {/* Left Button: Back or Cancel */}
                {state.currentStep !== 'confirmation' && (
                    <Button
                        variant="outline"
                        onClick={() => canGoBack ? dispatch({ type: 'GO_BACK' }) : onCancel()}
                        disabled={state.isProcessing}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {canGoBack ? 'Back' : 'Cancel'}
                    </Button>
                )}

                {/* Right Button: Next or Done */}
                {state.currentStep === 'confirmation' ? (
                    <Button
                        onClick={() => onComplete(state.bookingId || 'UNKNOWN')}
                        className="w-full"
                        size="lg"
                    >
                        Done - Return to Chat
                    </Button>
                ) : canGoNext && (
                    <Button
                        onClick={() => dispatch({ type: 'GO_NEXT' })}
                        disabled={state.isProcessing}
                    >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
