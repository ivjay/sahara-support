"use client";

import { Seat } from "./Seat";
import { VenueRow, SeatStatus } from "@/lib/booking/types";

interface SeatGridProps {
    rows: VenueRow[];
    selectedSeats: string[];
    onSeatClick: (label: string) => void;
}

export function SeatGrid({ rows, selectedSeats, onSeatClick, venueType }: SeatGridProps & { venueType?: string }) {
    const getSeatStatus = (label: string, originalStatus: SeatStatus): SeatStatus => {
        if (selectedSeats.includes(label)) return 'selected';
        return originalStatus;
    };

    const isMovieTheater = venueType === 'cinema_hall';

    return (
        <div className="space-y-4">
            {/* Movie Screen */}
            {isMovieTheater && (
                <div className="mb-8">
                    <div className="relative">
                        <div className="h-2 bg-gradient-to-b from-gray-400 to-gray-300 rounded-t-3xl shadow-lg"></div>
                        <div className="h-16 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-white text-sm font-semibold border-4 border-gray-700 rounded-lg shadow-2xl">
                            🎬 SCREEN 🎬
                        </div>
                        <div className="h-2 bg-gradient-to-t from-gray-400 to-gray-300 rounded-b-3xl shadow-lg"></div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">← All eyes this way</p>
                </div>
            )}

            {/* Seats */}
            <div className="space-y-2">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                    {/* Row label */}
                    <div className="w-6 text-center text-sm font-bold text-gray-600">
                        {row.label}
                    </div>

                    {/* Seats */}
                    <div className="flex gap-2">
                        {row.seats.map((seat, idx) => {
                            if (!seat) {
                                // Aisle gap
                                return <div key={idx} className="w-10" />;
                            }

                            return (
                                <Seat
                                    key={seat.label}
                                    label={seat.label}
                                    status={getSeatStatus(seat.label, seat.status)}
                                    type={seat.type}
                                    onClick={() => onSeatClick(seat.label)}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}
