"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, CreditCard, LogIn } from "lucide-react";
import { DateTimePicker } from "./steps/DateTimePicker";
import { ConsolidatedSeatSelection } from "./steps/ConsolidatedSeatSelection";
import { PaymentStep } from "./steps/PaymentStep";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

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
    const { user, isGuest } = useAuth();
    const [activeTab, setActiveTab] = useState("schedule");

    // Basic state
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [passengerCount, setPassengerCount] = useState(1);
    const [passengers, setPassengers] = useState<any[]>([
        { fullName: userProfile?.name || '', phone: userProfile?.phone || '', email: userProfile?.email || '' }
    ]);

    // Keep passengers array in sync with count
    useEffect(() => {
        setPassengers(prev => {
            if (prev.length === passengerCount) return prev;
            if (prev.length < passengerCount) {
                // Grow array
                const newArr = [...prev];
                for (let i = prev.length; i < passengerCount; i++) {
                    newArr.push({ fullName: '', phone: '', email: '' });
                }
                return newArr;
            }
            // Shrink array
            return prev.slice(0, passengerCount);
        });
    }, [passengerCount]);

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalPrice, setTotalPrice] = useState(selectedService.price || 0);

    const needsTime = serviceType === 'movie' || serviceType === 'appointment';
    const needsSeats = serviceType === 'movie' || serviceType === 'bus' || serviceType === 'flight';

    return (
        <Card className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="p-3 border-b">
                <h2 className="text-base font-semibold">{selectedService.title}</h2>
                <p className="text-xs text-muted-foreground">{selectedService.subtitle}</p>
            </div>

            {/* Tabs */}
            <div className="p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="schedule" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="hidden sm:inline">Schedule</span>
                        </TabsTrigger>
                        <TabsTrigger value="details" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Details</span>
                        </TabsTrigger>
                        <TabsTrigger value="payment" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span className="hidden sm:inline">Payment</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Schedule Tab */}
                    <TabsContent value="schedule" className="space-y-4 mt-6">
                        <div>
                            <h3 className="text-sm font-medium mb-3">Select Date & Time</h3>
                            <DateTimePicker
                                serviceType={serviceType}
                                serviceId={selectedService.id}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                onDateChange={setSelectedDate}
                                onTimeChange={setSelectedTime}
                                needsTime={needsTime}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => setActiveTab("details")}
                                disabled={!selectedDate || (needsTime && !selectedTime)}
                            >
                                Next: Enter Details
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4 mt-6">
                        {needsSeats ? (
                            <div>
                                <h3 className="text-sm font-medium mb-3">Select Seats & Enter Details</h3>
                                <ConsolidatedSeatSelection
                                    venueId={selectedService.venueId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'}
                                    serviceId={selectedService.id}
                                    eventDate={selectedDate || new Date().toISOString().split('T')[0]}
                                    eventTime={selectedTime || 'all-day'}
                                    passengerCount={passengerCount}
                                    passengers={passengers}
                                    selectedSeats={selectedSeats}
                                    sessionId={sessionId}
                                    serviceType={serviceType}
                                    userProfile={userProfile}
                                    onPassengerCountChange={setPassengerCount}
                                    onPassengerChange={(index, info) => {
                                        const newPassengers = [...passengers];
                                        newPassengers[index] = info;
                                        setPassengers(newPassengers);
                                    }}
                                    onSeatsChange={setSelectedSeats}
                                    onReserveSuccess={() => { }}
                                    onReserveFailure={() => { }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <h3 className="text-sm font-medium mb-3">Enter Your Details</h3>
                                {passengers.slice(0, passengerCount).map((passenger, index) => (
                                    <div key={index} className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            {serviceType === 'appointment' ? 'Patient' : 'Passenger'} {index + 1} {index === 0 && "(Primary Contact)"}
                                        </p>
                                        <div>
                                            <label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label>
                                            <input
                                                type="text"
                                                className="w-full mt-1 px-3 py-2 border rounded-lg"
                                                placeholder="Enter full name"
                                                value={passenger.fullName || ''}
                                                required
                                                onChange={(e) => {
                                                    const newPassengers = [...passengers];
                                                    newPassengers[index] = { ...newPassengers[index], fullName: e.target.value };
                                                    setPassengers(newPassengers);
                                                }}
                                            />
                                        </div>
                                        {index === 0 && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium">Phone <span className="text-destructive">*</span></label>
                                                    <input
                                                        type="tel"
                                                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                                                        placeholder="Enter phone number"
                                                        value={passenger.phone || ''}
                                                        required
                                                        onChange={(e) => {
                                                            const newPassengers = [...passengers];
                                                            newPassengers[index] = { ...newPassengers[index], phone: e.target.value };
                                                            setPassengers(newPassengers);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium">Email (Optional)</label>
                                                    <input
                                                        type="email"
                                                        className="w-full mt-1 px-3 py-2 border rounded-lg"
                                                        placeholder="Enter email"
                                                        value={passenger.email || ''}
                                                        onChange={(e) => {
                                                            const newPassengers = [...passengers];
                                                            newPassengers[index] = { ...newPassengers[index], email: e.target.value };
                                                            setPassengers(newPassengers);
                                                        }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setActiveTab("schedule")}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={() => {
                                    // Update total price based on passengers/seats
                                    const price = selectedService.price * (needsSeats ? selectedSeats.length : 1);
                                    setTotalPrice(price);
                                    setActiveTab("payment");
                                }}
                                disabled={needsSeats
                                    ? selectedSeats.length < passengerCount ||
                                    passengers.slice(0, passengerCount).some(p => !p.fullName?.trim()) ||
                                    !passengers[0]?.phone?.trim()
                                    : passengers.slice(0, passengerCount).some(p => !p.fullName?.trim()) ||
                                    !passengers[0]?.phone?.trim()
                                }
                            >
                                Next: Payment
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Payment Tab */}
                    <TabsContent value="payment" className="space-y-4 mt-6">
                        {/* Guest Login Gate */}
                        {!user && (
                            <Card className="p-6 border-2 border-primary/20 bg-primary/5 text-center">
                                <LogIn className="h-10 w-10 text-primary mx-auto mb-3" />
                                <h3 className="font-bold text-lg mb-2">Sign in to Confirm Booking</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create an account or sign in to complete your booking and manage your reservations.
                                </p>
                                <Link href="/">
                                    <Button className="gap-2">
                                        <LogIn className="h-4 w-4" />
                                        Sign In / Create Account
                                    </Button>
                                </Link>
                            </Card>
                        )}

                        {/* Booking Summary - only show when authenticated */}
                        {user && <Card className="p-4 bg-muted/50">
                            <h3 className="text-sm font-semibold mb-3">Booking Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Service:</span>
                                    <span className="font-medium">{selectedService.title}</span>
                                </div>
                                {selectedDate && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span className="font-medium">
                                            {new Date(selectedDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {selectedTime && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Time:</span>
                                        <span className="font-medium">{selectedTime}</span>
                                    </div>
                                )}
                                {selectedSeats.length > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Seats:</span>
                                        <span className="font-medium">{selectedSeats.join(', ')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold">Total:</span>
                                    <span className="font-bold text-lg text-primary">NPR {totalPrice}</span>
                                </div>
                            </div>
                        </Card>}

                        {/* Payment Options */}
                        {user && <div>
                            <h3 className="text-sm font-medium mb-3">Select Payment Method</h3>
                            <PaymentStep
                                totalPrice={totalPrice}
                                currency="NPR"
                                onPaymentSelect={() => { }}
                                onComplete={onComplete}
                                bookingData={{
                                    serviceId: selectedService.id,
                                    serviceType,
                                    serviceTitle: selectedService.title,
                                    serviceSubtitle: selectedService.subtitle,
                                    date: selectedDate!,
                                    time: selectedTime || 'all-day',
                                    passengers: passengers,
                                    seats: selectedSeats
                                }}
                            />
                        </div>}

                        <div className="flex justify-start pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setActiveTab("details")}
                            >
                                Back
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </Card>
    );
}
