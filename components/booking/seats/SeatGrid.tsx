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
    const isBus = venueType === 'bus';
    const isFlight = venueType === 'flight' || venueType === 'airplane';

    return (
        <div className="space-y-4">
            {/* Movie Screen */}
            {isMovieTheater && (
                <div className="mb-8">
                    <div className="relative">
                        <div className="h-2 bg-gradient-to-b from-gray-400 to-gray-300 rounded-t-3xl shadow-lg"></div>
                        <div className="h-16 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-white text-sm font-semibold border-4 border-gray-700 rounded-lg shadow-2xl">
                            SCREEN
                        </div>
                        <div className="h-2 bg-gradient-to-t from-gray-400 to-gray-300 rounded-b-3xl shadow-lg"></div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">All eyes this way</p>
                </div>
            )}

            {/* Bus Driver's Seat */}
            {isBus && (
                <div className="mb-8">
                    <div className="relative bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border-2 border-gray-700 shadow-lg">
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <span className="text-white text-sm font-semibold">DRIVER'S CABIN</span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">Front of the bus</p>
                </div>
            )}

            {/* Flight Cockpit */}
            {isFlight && (
                <div className="mb-8">
                    <div className="relative bg-gradient-to-r from-blue-900 to-indigo-900 rounded-lg p-4 border-2 border-blue-700 shadow-lg">
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <span className="text-white text-sm font-semibold">COCKPIT</span>
                        </div>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">Front of the aircraft</p>
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
