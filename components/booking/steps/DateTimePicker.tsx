"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, Bus, Plane } from "lucide-react";

interface DateTimePickerProps {
    serviceType: string;
    serviceId: string;
    selectedDate: string | null;
    selectedTime: string | null;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    needsTime: boolean;
}

// Realistic bus departure schedule (Nepal coach services)
const BUS_DEPARTURES = [
    { time: '05:30', label: 'Early Morning', popular: false },
    { time: '06:00', label: 'Morning',       popular: true  },
    { time: '07:00', label: 'Morning',       popular: true  },
    { time: '08:00', label: 'Morning',       popular: false },
    { time: '10:00', label: 'Mid Morning',   popular: false },
    { time: '12:00', label: 'Noon',          popular: false },
    { time: '14:00', label: 'Afternoon',     popular: false },
    { time: '16:00', label: 'Afternoon',     popular: false },
    { time: '18:00', label: 'Evening',       popular: false },
    { time: '20:00', label: 'Night',         popular: false },
    { time: '21:30', label: 'Night',         popular: false },
    { time: '22:00', label: 'Night Bus',     popular: false },
];

// Realistic domestic flight schedule (Nepal airlines)
const FLIGHT_DEPARTURES = [
    { time: '06:00', label: 'Early',         popular: false },
    { time: '07:30', label: 'Morning',       popular: true  },
    { time: '09:00', label: 'Morning',       popular: true  },
    { time: '10:30', label: 'Mid Morning',   popular: false },
    { time: '12:00', label: 'Noon',          popular: false },
    { time: '13:30', label: 'Afternoon',     popular: false },
    { time: '15:00', label: 'Afternoon',     popular: true  },
    { time: '16:30', label: 'Late Afternoon',popular: false },
    { time: '18:00', label: 'Evening',       popular: false },
];

// Movie showtimes
const MOVIE_SHOWTIMES = ['13:00', '15:30', '18:00', '20:30', '22:00'];

function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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

    // Fetch time slots when date changes (appointments only)
    useEffect(() => {
        if (selectedDate && serviceType === 'appointment') {
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
            const dateStr = date.toISOString().split('T')[0];
            onDateChange(dateStr);
        }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeLabel = {
        appointment: 'Select Time Slot',
        movie:       'Select Showtime',
        bus:         'Select Departure Time',
        flight:      'Select Departure Time',
    }[serviceType] ?? 'Select Time';

    const TimeIcon = serviceType === 'bus' ? Bus : serviceType === 'flight' ? Plane : Clock;

    return (
        <div className="space-y-8">

            {/* ── DATE ── */}
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

            {/* ── TIME ── */}
            {needsTime && selectedDate && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <TimeIcon className="w-5 h-5 text-primary" />
                        <Label className="text-lg font-semibold">{timeLabel}</Label>
                    </div>

                    {/* APPOINTMENT – fetched slots */}
                    {serviceType === 'appointment' && (
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
                    )}

                    {/* MOVIE – fixed showtimes */}
                    {serviceType === 'movie' && (
                        <div className="grid grid-cols-3 gap-3">
                            {MOVIE_SHOWTIMES.map((time) => (
                                <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    className={cn(
                                        "h-14 text-base font-semibold transition-all",
                                        selectedTime === time && "shadow-lg shadow-primary/30 scale-105"
                                    )}
                                    onClick={() => onTimeChange(time)}
                                >
                                    {formatTime(time)}
                                </Button>
                            ))}
                        </div>
                    )}

                    {/* BUS – departure schedule */}
                    {serviceType === 'bus' && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Choose your preferred departure time
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {BUS_DEPARTURES.map(({ time, label, popular }) => (
                                    <button
                                        key={time}
                                        onClick={() => onTimeChange(time)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center h-16 rounded-xl border-2 transition-all",
                                            selectedTime === time
                                                ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-md shadow-orange-200 dark:shadow-orange-900/30 scale-105"
                                                : "border-border bg-card hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-orange-950/10"
                                        )}
                                    >
                                        {popular && (
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">
                                                Popular
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-base font-bold",
                                            selectedTime === time ? "text-orange-600 dark:text-orange-400" : "text-foreground"
                                        )}>
                                            {formatTime(time)}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FLIGHT – departure schedule */}
                    {serviceType === 'flight' && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Choose your preferred departure time
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {FLIGHT_DEPARTURES.map(({ time, label, popular }) => (
                                    <button
                                        key={time}
                                        onClick={() => onTimeChange(time)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center h-16 rounded-xl border-2 transition-all",
                                            selectedTime === time
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md shadow-blue-200 dark:shadow-blue-900/30 scale-105"
                                                : "border-border bg-card hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/10"
                                        )}
                                    >
                                        {popular && (
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white">
                                                Popular
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-base font-bold",
                                            selectedTime === time ? "text-blue-600 dark:text-blue-400" : "text-foreground"
                                        )}>
                                            {formatTime(time)}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
