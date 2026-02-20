"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeatGrid } from "../booking/seats/SeatGrid";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VenueRow, SeatInventoryRow, SeatConfig } from "@/lib/types/rpc-responses";

interface ChatSeatPickerProps {
    venueId: string;
    serviceId: string;
    eventDate: string;
    eventTime: string;
    onSelectionComplete: (seats: string[]) => void;
    onCancel: () => void;
}

export function ChatSeatPicker({
    venueId,
    serviceId,
    eventDate,
    eventTime,
    onSelectionComplete,
    onCancel
}: ChatSeatPickerProps) {
    const [venue, setVenue] = useState<VenueRow | null>(null);
    const [seatInventory, setSeatInventory] = useState<SeatInventoryRow[]>([]);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchSeats();
    }, [venueId, serviceId, eventDate, eventTime]);

    const handleConfirm = () => {
        if (selectedSeats.length > 0) {
            onSelectionComplete(selectedSeats);
        }
    };

    if (loading) {
        return (
            <Card className="w-full max-w-sm p-8 flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm border-primary/20">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-medium text-muted-foreground">Fetching live seat map...</p>
            </Card>
        );
    }

    // Merge static venue rows with real-time seat inventory
    const venueRows = (venue?.seat_config?.rows || []).map((row) => ({
        label: row.label,
        seats: row.seats.map((seat) => {
            if (!seat) return null;
            const label = seat.label || `${row.label}${seat.number}`;
            const inventoryItem = seatInventory.find(inv => inv.seat_label === label);
            return {
                label,
                type: (seat.type || 'regular') as 'regular' | 'premium' | 'vip' | 'disabled',
                status: (inventoryItem?.status || 'available') as 'available' | 'reserved' | 'booked' | 'blocked'
            };
        })
    }));

    return (
        <Card className="w-full max-w-sm overflow-hidden bg-background/50 border-primary/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 border-b bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">SELECT SEATS</span>
                </div>
                <button
                    onClick={onCancel}
                    className="p-1 hover:bg-red-500/10 rounded-full text-muted-foreground hover:text-red-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 flex flex-col items-center">
                <SeatGrid
                    rows={venueRows}
                    venueType={venue?.type}
                    eventDate={eventDate}
                    eventTime={eventTime}
                    selectedSeats={selectedSeats}
                    onSeatClick={(label) => {
                        setSelectedSeats(prev =>
                            prev.includes(label)
                                ? prev.filter(s => s !== label)
                                : [...prev, label]
                        );
                    }}
                />

                <div className="w-full mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground italic">
                        {selectedSeats.length > 0
                            ? `${selectedSeats.length} seat(s) selected`
                            : "Click seats to select"}
                    </div>
                    <Button
                        size="sm"
                        disabled={selectedSeats.length === 0}
                        onClick={handleConfirm}
                        className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                        <Check className="w-4 h-4" />
                        Confirm
                    </Button>
                </div>
            </div>
        </Card>
    );
}
