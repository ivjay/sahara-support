"use client";

import { SeatMap } from "../seats/SeatMap";

interface SeatSelectionProps {
    venueId: string;
    serviceId: string;
    eventDate: string;
    eventTime: string;
    maxSelectable: number;
    selectedSeats: string[];
    sessionId: string;
    onSeatsChange: (seats: string[]) => void;
    onReserveSuccess: (expiry: Date) => void;
    onReserveFailure: (failedSeats: string[]) => void;
}

export function SeatSelection({
    venueId,
    serviceId,
    eventDate,
    eventTime,
    maxSelectable,
    selectedSeats,
    sessionId,
    onSeatsChange,
    onReserveSuccess,
    onReserveFailure
}: SeatSelectionProps) {
    async function handleReserve(seats: string[]) {
        const response = await fetch('/api/seats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                venueId,
                serviceId,
                eventDate,
                eventTime,
                seatLabels: seats,
                sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            onReserveSuccess(new Date(result.expiry));
        } else {
            onReserveFailure(result.failedSeats || []);
        }

        return result;
    }

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">Select Your Seats</h3>
            <SeatMap
                venueId={venueId}
                serviceId={serviceId}
                eventDate={eventDate}
                eventTime={eventTime}
                maxSelectable={maxSelectable}
                selectedSeats={selectedSeats}
                onSeatsChange={onSeatsChange}
                onReserve={handleReserve}
            />
        </div>
    );
}
