"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock } from "lucide-react";

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
    const [calendarDate, setCalendarDate] = useState<Date | undefined>(
        selectedDate ? new Date(selectedDate) : undefined
    );

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

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setCalendarDate(date);
            // Convert to YYYY-MM-DD format
            const dateStr = date.toISOString().split('T')[0];
            onDateChange(dateStr);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className="space-y-8">
            {/* Date Selection */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <Label className="text-lg font-semibold">Select Date</Label>
                </div>
                <Card className="p-4 w-fit mx-auto border-2 shadow-lg">
                    <Calendar
                        mode="single"
                        selected={calendarDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < today}
                        className="rounded-lg"
                    />
                </Card>
            </div>

            {/* Time Selection */}
            {needsTime && selectedDate && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-primary" />
                        <Label className="text-lg font-semibold">
                            {serviceType === 'appointment' ? 'Select Time Slot' : 'Select Showtime'}
                        </Label>
                    </div>

                    {serviceType === 'appointment' ? (
                        // Time slots grid for appointments
                        loadingSlots ? (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center gap-2 text-muted-foreground">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    Loading slots...
                                </div>
                            </div>
                        ) : timeSlots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {timeSlots.map((slot) => (
                                    <Button
                                        key={slot.time}
                                        variant={selectedTime === slot.time ? "default" : "outline"}
                                        className={cn(
                                            "h-12 font-medium transition-all",
                                            selectedTime === slot.time && "shadow-lg shadow-primary/30 scale-105",
                                            slot.status !== 'available' && "opacity-40 cursor-not-allowed"
                                        )}
                                        onClick={() => slot.status === 'available' && onTimeChange(slot.time)}
                                        disabled={slot.status !== 'available'}
                                    >
                                        {slot.formattedTime || slot.time}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No slots available for this date
                            </div>
                        )
                    ) : (
                        // Simple time options for movies
                        <div className="grid grid-cols-3 gap-3">
                            {['15:00', '18:00', '21:00'].map((time) => (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    className={cn(
                                        "h-14 text-lg font-semibold transition-all",
                                        selectedTime === time && "shadow-lg shadow-primary/30 scale-105"
                                    )}
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
