"use client";

import { Seat } from "./Seat";
import { VenueRow, SeatStatus, SeatType, SeatInfo } from "@/lib/booking/types";

interface SeatGridProps {
    rows: VenueRow[];
    selectedSeats: string[];
    onSeatClick: (label: string) => void;
    venueType?: string;
    eventDate?: string;
    eventTime?: string;
}

// Build a label→status lookup from whatever Supabase returned
function buildStatusLookup(rows: VenueRow[]): Record<string, SeatStatus> {
    const map: Record<string, SeatStatus> = {};
    rows.forEach(row => {
        row.seats.forEach(seat => {
            if (seat && seat.label) {
                map[seat.label] = seat.status;
            }
        });
    });
    return map;
}

function makeSeat(label: string, type: SeatType, lookup: Record<string, SeatStatus>): SeatInfo {
    return { label, type, status: lookup[label] ?? 'available' };
}

// Bus: 10 rows, 2 + aisle + 2   labels: 1A 1B | 1C 1D
function generateBusRows(lookup: Record<string, SeatStatus>): (SeatInfo | null)[][] {
    return Array.from({ length: 10 }, (_, i) => {
        const r = i + 1;
        return [
            makeSeat(`${r}A`, 'window', lookup),
            makeSeat(`${r}B`, 'aisle',  lookup),
            null,
            makeSeat(`${r}C`, 'aisle',  lookup),
            makeSeat(`${r}D`, 'window', lookup),
        ];
    });
}

// Flight: 20 rows, 3 + aisle + 3   labels: 1A 1B 1C | 1D 1E 1F
function generateFlightRows(lookup: Record<string, SeatStatus>): (SeatInfo | null)[][] {
    return Array.from({ length: 20 }, (_, i) => {
        const r = i + 1;
        return [
            makeSeat(`${r}A`, 'window',  lookup),
            makeSeat(`${r}B`, 'regular', lookup),
            makeSeat(`${r}C`, 'aisle',   lookup),
            null,
            makeSeat(`${r}D`, 'aisle',   lookup),
            makeSeat(`${r}E`, 'regular', lookup),
            makeSeat(`${r}F`, 'window',  lookup),
        ];
    });
}

function formatDate(dateStr?: string): string {
    if (!dateStr || dateStr === 'all-day') return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function formatTime(timeStr?: string): string {
    if (!timeStr || timeStr === 'all-day') return '--:--';
    // If already formatted like "07:00 AM" just return it
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    // Convert 24h "07:00" → "7:00 AM"
    try {
        const [h, m] = timeStr.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour = h % 12 || 12;
        return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
    } catch {
        return timeStr;
    }
}

export function SeatGrid({ rows, selectedSeats, onSeatClick, venueType, eventDate, eventTime }: SeatGridProps) {
    const getSeatStatus = (label: string, originalStatus: SeatStatus): SeatStatus => {
        if (selectedSeats.includes(label)) return 'selected';
        return originalStatus;
    };

    const isMovieTheater = venueType === 'cinema_hall';
    const isBus          = venueType === 'bus';
    const isFlight       = venueType === 'flight' || venueType === 'airplane';

    const statusLookup = buildStatusLookup(rows);

    let displayRows: { label: string; seats: (SeatInfo | null)[] }[];
    if (isBus) {
        displayRows = generateBusRows(statusLookup).map((seats, i) => ({ label: String(i + 1), seats }));
    } else if (isFlight) {
        displayRows = generateFlightRows(statusLookup).map((seats, i) => ({ label: String(i + 1), seats }));
    } else {
        displayRows = rows;
    }

    const formattedDate = formatDate(eventDate);
    const formattedTime = formatTime(eventTime);

    return (
        <div className="space-y-4">

            {/* ── MOVIE SCREEN ── */}
            {isMovieTheater && (
                <div className="mb-8">
                    <div className="relative">
                        <div className="h-2 bg-gradient-to-b from-gray-400 to-gray-300 rounded-t-3xl shadow-lg" />
                        <div className="h-16 bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center text-white text-sm font-semibold border-4 border-gray-700 rounded-lg shadow-2xl">
                            SCREEN
                        </div>
                        <div className="h-2 bg-gradient-to-t from-gray-400 to-gray-300 rounded-b-3xl shadow-lg" />
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">All eyes this way</p>
                </div>
            )}

            {/* ── BUS HEADER ── */}
            {isBus && (
                <div className="mb-2 space-y-3">
                    {/* Driver cabin */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 border-2 border-gray-700 shadow-lg">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <span className="text-white text-sm font-bold tracking-wide">DRIVER'S CABIN</span>
                        </div>
                    </div>

                    {/* Time & Date strip */}
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Departure */}
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-0.5">Departure</p>
                                <p className="text-xl font-bold text-orange-700 dark:text-orange-300 leading-none">{formattedTime}</p>
                                {formattedDate && (
                                    <p className="text-[11px] text-orange-600/70 dark:text-orange-400/70 mt-1">{formattedDate}</p>
                                )}
                            </div>

                            {/* Journey arrow */}
                            <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex items-center w-full">
                                    <div className="h-0.5 flex-1 bg-orange-300 dark:bg-orange-700" />
                                    <div className="mx-1 text-orange-400">🚌</div>
                                    <div className="h-0.5 flex-1 bg-dashed bg-orange-300 dark:bg-orange-700 border-t-2 border-dashed border-orange-300 dark:border-orange-700" style={{background:'none'}} />
                                </div>
                                <p className="text-[10px] text-orange-500/70 font-medium">Coach Service</p>
                            </div>

                            {/* Arrival placeholder */}
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider mb-0.5">Arrival</p>
                                <p className="text-xl font-bold text-orange-700 dark:text-orange-300 leading-none">TBD</p>
                                <p className="text-[11px] text-orange-600/70 dark:text-orange-400/70 mt-1">On arrival</p>
                            </div>
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-center gap-2 px-1 pt-1">
                        <div className="w-6" />
                        <div className="flex gap-2">
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">A</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">B</div>
                        </div>
                        <div className="w-10 text-center text-[10px] text-muted-foreground/50">│</div>
                        <div className="flex gap-2">
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">C</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">D</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FLIGHT HEADER ── */}
            {isFlight && (
                <div className="mb-2 space-y-3">
                    {/* Cockpit */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-4 border-2 border-blue-700 shadow-lg">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                </svg>
                            </div>
                            <span className="text-white text-sm font-bold tracking-wide">COCKPIT</span>
                        </div>
                    </div>

                    {/* Flight time strip */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                            {/* Departure */}
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Departure</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 leading-none">{formattedTime}</p>
                                {formattedDate && (
                                    <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">{formattedDate}</p>
                                )}
                            </div>

                            {/* Flight path */}
                            <div className="flex-1 flex flex-col items-center gap-1">
                                <div className="flex items-center w-full gap-1">
                                    <div className="h-px flex-1 bg-blue-300 dark:bg-blue-700" />
                                    <div className="text-base">✈️</div>
                                    <div className="h-px flex-1 border-t border-dashed border-blue-300 dark:border-blue-700" />
                                </div>
                                <p className="text-[10px] text-blue-500/70 font-medium">Domestic Flight</p>
                            </div>

                            {/* Arrival */}
                            <div className="text-center">
                                <p className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-0.5">Arrival</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300 leading-none">TBD</p>
                                <p className="text-[11px] text-blue-600/70 dark:text-blue-400/70 mt-1">On arrival</p>
                            </div>
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-center gap-2 px-1 pt-1">
                        <div className="w-6" />
                        <div className="flex gap-2">
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">A</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">B</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">C</div>
                        </div>
                        <div className="w-10 text-center text-[10px] text-muted-foreground/50">│</div>
                        <div className="flex gap-2">
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">D</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">E</div>
                            <div className="w-11 text-center text-xs font-bold text-muted-foreground">F</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SEAT GRID ── */}
            <div className="space-y-2">
                {displayRows.map((row) => (
                    <div key={row.label} className="flex items-center gap-2">
                        <div className="w-6 text-center text-xs font-bold text-muted-foreground/60">
                            {row.label}
                        </div>
                        <div className="flex gap-2">
                            {row.seats.map((seat, idx) => {
                                if (!seat) {
                                    return (
                                        <div
                                            key={`${row.label}-aisle-${idx}`}
                                            className="w-10 flex items-center justify-center"
                                        >
                                            <div className="w-px h-8 bg-border" />
                                        </div>
                                    );
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
