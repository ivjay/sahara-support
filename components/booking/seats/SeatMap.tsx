"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SeatGrid } from "./SeatGrid";
import { VenueRow, SeatInfo, SeatInventoryItem } from "@/lib/booking/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface SeatMapProps {
    venueId: string;
    serviceId: string;
    eventDate: string;
    eventTime: string;
    maxSelectable: number;
    selectedSeats: string[];
    onSeatsChange: (seats: string[]) => void;
    onReserve: (seats: string[]) => Promise<{success: boolean; failedSeats?: string[]; expiry?: Date}>;
}

export function SeatMap({
    venueId,
    serviceId,
    eventDate,
    eventTime,
    maxSelectable,
    selectedSeats,
    onSeatsChange,
    onReserve
}: SeatMapProps) {
    const [rows, setRows] = useState<VenueRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reserving, setReserving] = useState(false);
    const [venueType, setVenueType] = useState<string>('');

    // Fetch seat map
    useEffect(() => {
        fetchSeats();
    }, [venueId, serviceId, eventDate, eventTime]);

    // Subscribe to realtime updates
    useEffect(() => {
        const channel = supabase
            .channel(`seats:${venueId}:${eventDate}:${eventTime}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'seat_inventory',
                    filter: `venue_id=eq.${venueId}`
                },
                (payload) => {
                    const updatedSeat = payload.new as SeatInventoryItem;
                    if (updatedSeat.service_id === serviceId &&
                        updatedSeat.event_date === eventDate &&
                        updatedSeat.event_time === eventTime) {
                        updateSeatStatus(updatedSeat.seatLabel, updatedSeat.status);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [venueId, serviceId, eventDate, eventTime]);

    async function fetchSeats() {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/seats?venueId=${venueId}&serviceId=${serviceId}&eventDate=${eventDate}&eventTime=${eventTime}`
            );

            if (!response.ok) throw new Error('Failed to fetch seats');

            const data = await response.json();
            const seatMap = buildSeatMap(data.venue.seat_config, data.seats);
            setRows(seatMap);
            setVenueType(data.venue.venue_type || '');
            setError(null);
        } catch (err: any) {
            console.error('[SeatMap] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function buildSeatMap(config: any, inventory: SeatInventoryItem[]): VenueRow[] {
        const inventoryMap = new Map(inventory.map(s => [s.seatLabel, s.status]));

        return config.rows.map((row: any) => ({
            label: row.label,
            seats: row.seats.map((seat: any) => {
                if (!seat) return null;

                const label = typeof seat.number === 'number'
                    ? `${row.label}${seat.number}`
                    : `${row.label}${seat.number}`;

                return {
                    label,
                    type: seat.type,
                    status: inventoryMap.get(label) || 'available'
                } as SeatInfo;
            })
        }));
    }

    function updateSeatStatus(label: string, status: string) {
        setRows(prev => prev.map(row => ({
            ...row,
            seats: row.seats.map(seat => {
                if (!seat || seat.label !== label) return seat;
                return { ...seat, status: status as any };
            })
        })));
    }

    function handleSeatClick(label: string) {
        if (selectedSeats.includes(label)) {
            // Deselect
            onSeatsChange(selectedSeats.filter(s => s !== label));
        } else if (selectedSeats.length < maxSelectable) {
            // Select
            onSeatsChange([...selectedSeats, label]);
        } else {
            setError(`You can only select ${maxSelectable} seat(s)`);
        }
    }

    async function handleReserve() {
        if (selectedSeats.length === 0) return;

        setReserving(true);
        setError(null);

        try {
            const result = await onReserve(selectedSeats);
            if (!result.success && result.failedSeats) {
                setError(`Failed to reserve: ${result.failedSeats.join(', ')}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setReserving(false);
        }
    }

    if (loading) {
        return <div className="text-center py-8">Loading seats...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Legend */}
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded" />
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 rounded" />
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 border-2 border-gray-300 rounded" />
                    <span>Booked</span>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Seat grid */}
            <div className="bg-white p-6 rounded-lg border overflow-x-auto">
                <SeatGrid
                    venueType={venueType}
                    rows={rows}
                    selectedSeats={selectedSeats}
                    onSeatClick={handleSeatClick}
                />
            </div>

            {/* Reserve button */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Selected: {selectedSeats.length} / {maxSelectable}
                </div>
                <Button
                    onClick={handleReserve}
                    disabled={selectedSeats.length === 0 || reserving}
                    size="lg"
                >
                    {reserving ? 'Reserving...' : `Reserve ${selectedSeats.length} Seat(s)`}
                </Button>
            </div>
        </div>
    );
}
