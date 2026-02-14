"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SeatGrid } from "../seats/SeatGrid";
import { Users, UserCircle2, Phone, Mail, Minus, Plus } from "lucide-react";
import { PassengerInfo } from "@/lib/booking/types";
import { cn } from "@/lib/utils";

interface ConsolidatedSeatSelectionProps {
    venueId: string;
    serviceId: string;
    eventDate: string;
    eventTime: string;
    passengerCount: number;
    passengers: PassengerInfo[];
    selectedSeats: string[];
    sessionId: string;
    userProfile?: {
        name?: string;
        phone?: string;
        email?: string;
    };
    onPassengerCountChange: (count: number) => void;
    onPassengerChange: (index: number, info: PassengerInfo) => void;
    onSeatsChange: (seats: string[]) => void;
    onReserveSuccess: (expiry: string) => void;
    onReserveFailure: (failedSeats: string[]) => void;
}

export function ConsolidatedSeatSelection({
    venueId,
    serviceId,
    eventDate,
    eventTime,
    passengerCount,
    passengers,
    selectedSeats,
    sessionId,
    userProfile,
    onPassengerCountChange,
    onPassengerChange,
    onSeatsChange,
    onReserveSuccess,
    onReserveFailure
}: ConsolidatedSeatSelectionProps) {
    const [venue, setVenue] = useState<any>(null);
    const [seatInventory, setSeatInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState(false);
    const [reservationExpiry, setReservationExpiry] = useState<string | null>(null);

    // Auto-fill first passenger from user profile
    useEffect(() => {
        if (userProfile && passengers.length > 0 && !passengers[0].fullName) {
            const firstPassenger: PassengerInfo = {
                fullName: userProfile.name || '',
                phone: userProfile.phone || '',
                email: userProfile.email || ''
            };
            onPassengerChange(0, firstPassenger);
        }
    }, [userProfile]);

    // Fetch seats
    useEffect(() => {
        fetchSeats();
    }, [venueId, serviceId, eventDate, eventTime]);

    // Auto-reserve when seats are selected
    useEffect(() => {
        if (selectedSeats.length === passengerCount && selectedSeats.length > 0) {
            reserveSeats();
        }
    }, [selectedSeats, passengerCount]);

    async function fetchSeats() {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/seats?venueId=${venueId}&serviceId=${serviceId}&eventDate=${eventDate}&eventTime=${eventTime || 'all-day'}`
            );
            const data = await response.json();
            setVenue(data.venue);
            setSeatInventory(data.seats || []);
        } catch (error) {
            console.error('Failed to fetch seats:', error);
        } finally {
            setLoading(false);
        }
    }

    async function reserveSeats() {
        if (reserving || selectedSeats.length === 0) return;

        setReserving(true);
        try {
            const response = await fetch('/api/seats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    venueId,
                    serviceId,
                    eventDate,
                    eventTime: eventTime || 'all-day',
                    seatLabels: selectedSeats,
                    sessionId
                })
            });

            const result = await response.json();

            if (result.success) {
                setReservationExpiry(result.expiry);
                onReserveSuccess(result.expiry);
            } else {
                onReserveFailure(result.failedSeats || []);
            }
        } catch (error) {
            console.error('Failed to reserve seats:', error);
        } finally {
            setReserving(false);
        }
    }

    const handleSeatClick = (label: string) => {
        const newSeats = selectedSeats.includes(label)
            ? selectedSeats.filter(s => s !== label)
            : selectedSeats.length < passengerCount
                ? [...selectedSeats, label]
                : selectedSeats;

        onSeatsChange(newSeats);
    };

    const incrementCount = () => {
        if (passengerCount < 10) {
            onPassengerCountChange(passengerCount + 1);
        }
    };

    const decrementCount = () => {
        if (passengerCount > 1) {
            onPassengerCountChange(passengerCount - 1);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Loading seats...
                </div>
            </div>
        );
    }

    const venueRows = venue?.seat_config?.rows || [];

    return (
        <div className="space-y-6">
            {/* Passenger Count */}
            <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Number of Passengers</Label>
                </div>
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={decrementCount}
                        disabled={passengerCount <= 1}
                        className="h-12 w-12 rounded-full"
                    >
                        <Minus className="h-5 w-5" />
                    </Button>
                    <div className="text-4xl font-bold w-20 text-center">
                        {passengerCount}
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={incrementCount}
                        disabled={passengerCount >= 10}
                        className="h-12 w-12 rounded-full"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                    Select seats for {passengerCount} {passengerCount === 1 ? 'person' : 'people'}
                </p>
            </Card>

            {/* Seat Selection */}
            <Card className="p-6 border-2">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Select Your Seats</h3>
                    <p className="text-sm text-muted-foreground">
                        {selectedSeats.length === 0
                            ? `Choose ${passengerCount} seat${passengerCount > 1 ? 's' : ''}`
                            : `${selectedSeats.length} of ${passengerCount} selected${reservationExpiry ? ' (Reserved)' : ''}`
                        }
                    </p>
                </div>

                <SeatGrid
                    rows={venueRows}
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                    venueType={venue?.venue_type}
                />

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 border-2 border-green-500" />
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary border-2 border-primary" />
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-400 opacity-50" />
                        <span>Occupied</span>
                    </div>
                </div>
            </Card>

            {/* Passenger Details */}
            <Card className="p-6 border-2">
                <div className="flex items-center gap-3 mb-6">
                    <UserCircle2 className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Passenger Details</Label>
                </div>

                <div className="space-y-6">
                    {passengers.slice(0, passengerCount).map((passenger, index) => (
                        <div key={index} className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                    {index + 1}
                                </div>
                                <span className="font-medium">
                                    Passenger {index + 1}
                                    {index === 0 && ' (Primary Contact)'}
                                </span>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor={`name-${index}`} className="mb-2 block">
                                        Full Name *
                                    </Label>
                                    <Input
                                        id={`name-${index}`}
                                        placeholder="John Doe"
                                        value={passenger.fullName || ''}
                                        onChange={(e) => onPassengerChange(index, {
                                            ...passenger,
                                            fullName: e.target.value
                                        })}
                                        className="h-12"
                                    />
                                </div>

                                {index === 0 && (
                                    <>
                                        <div>
                                            <Label htmlFor="phone" className="mb-2 block">
                                                Phone Number {index === 0 && '*'}
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="9812345678"
                                                    value={passenger.phone || ''}
                                                    onChange={(e) => onPassengerChange(index, {
                                                        ...passenger,
                                                        phone: e.target.value
                                                    })}
                                                    className="h-12 pl-10"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <Label htmlFor="email" className="mb-2 block">
                                                Email (Optional)
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="john@example.com"
                                                    value={passenger.email || ''}
                                                    onChange={(e) => onPassengerChange(index, {
                                                        ...passenger,
                                                        email: e.target.value
                                                    })}
                                                    className="h-12 pl-10"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
