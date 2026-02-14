"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
    serviceType: string;
    serviceId: string;
    selectedDate: string | null;
    selectedTime: string | null;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    needsTime: boolean;
}

export function DateTimePicker({
    serviceType,
    serviceId,
    selectedDate,
    selectedTime,
    onDateChange,
    onTimeChange,
    needsTime
}: DateTimePickerProps) {
    const [timeSlots, setTimeSlots] = useState<any[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Fetch time slots when date changes (for appointments)
    useEffect(() => {
        if (selectedDate && needsTime && serviceType === 'appointment') {
            fetchTimeSlots();
        }
    }, [selectedDate, serviceType]);

    async function fetchTimeSlots() {
        if (!selectedDate) return;

        setLoadingSlots(true);
        try {
            const response = await fetch(`/api/time-slots?serviceId=${serviceId}&date=${selectedDate}`);
            const data = await response.json();
            setTimeSlots(data.slots || []);
        } catch (error) {
            console.error('Failed to fetch time slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    }

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            {/* Date Selection */}
            <div>
                <Label className="text-lg font-semibold mb-2 block">Select Date</Label>
                <Input
                    type="date"
                    min={minDate}
                    value={selectedDate || ''}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="text-lg p-6"
                />
            </div>

            {/* Time Selection */}
            {needsTime && selectedDate && (
                <div>
                    <Label className="text-lg font-semibold mb-2 block">
                        {serviceType === 'appointment' ? 'Select Time Slot' : 'Select Showtime'}
                    </Label>

                    {serviceType === 'appointment' ? (
                        // Time slots grid for appointments
                        loadingSlots ? (
                            <div className="text-center py-4">Loading slots...</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {timeSlots.map((slot) => (
                                    <Button
                                        key={slot.time}
                                        variant={selectedTime === slot.time ? "default" : "outline"}
                                        className={cn(
                                            "h-14",
                                            slot.status !== 'available' && "opacity-50 cursor-not-allowed"
                                        )}
                                        onClick={() => slot.status === 'available' && onTimeChange(slot.time)}
                                        disabled={slot.status !== 'available'}
                                    >
                                        {slot.formattedTime || slot.time}
                                    </Button>
                                ))}
                            </div>
                        )
                    ) : (
                        // Simple time dropdown for movies
                        <div className="grid grid-cols-3 gap-2">
                            {['15:00', '18:00', '21:00'].map((time) => (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    className="h-14 text-lg"
                                    onClick={() => onTimeChange(time)}
                                >
                                    {formatTime(time)}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
