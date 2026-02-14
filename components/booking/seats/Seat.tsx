"use client";

import { cn } from "@/lib/utils";
import { SeatStatus, SeatType } from "@/lib/booking/types";
import { Crown, Sparkles } from "lucide-react";

interface SeatProps {
    label: string;
    status: SeatStatus;
    type?: SeatType;
    onClick: () => void;
    disabled?: boolean;
}

export function Seat({ label, status, type = 'regular', onClick, disabled }: SeatProps) {
    const isAvailable = status === 'available';
    const isSelected = status === 'selected';
    const isBooked = status === 'booked' || status === 'reserved';

    // Get seat-type specific styling
    const getTypeStyles = () => {
        if (isSelected) {
            return "bg-blue-600 border-blue-700 text-white scale-110 shadow-xl ring-2 ring-blue-400";
        }
        if (isBooked) {
            return "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-50";
        }

        // Available seats - different colors by type
        switch (type) {
            case 'vip':
                return "bg-gradient-to-br from-purple-400 to-purple-500 border-purple-600 text-white hover:from-purple-500 hover:to-purple-600";
            case 'business':
                return "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-600 text-white hover:from-amber-500 hover:to-amber-600";
            case 'window':
                return "bg-gradient-to-br from-blue-400 to-blue-500 border-blue-600 text-white hover:from-blue-500 hover:to-blue-600";
            case 'aisle':
                return "bg-gradient-to-br from-green-400 to-green-500 border-green-600 text-white hover:from-green-500 hover:to-green-600";
            case 'economy':
                return "bg-gradient-to-br from-teal-400 to-teal-500 border-teal-600 text-white hover:from-teal-500 hover:to-teal-600";
            default: // regular
                return "bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-600";
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isBooked}
            className={cn(
                "w-11 h-11 rounded-lg text-xs font-bold transition-all duration-200 relative",
                "flex items-center justify-center",
                "border-2",
                getTypeStyles(),
                !isBooked && !disabled && "hover:scale-110 active:scale-95 hover:shadow-lg"
            )}
            title={`Seat ${label} - ${type} ${isBooked ? '(Taken)' : ''}`}
        >
            <span className="relative z-10">{label}</span>
            {/* Premium seat indicator */}
            {(type === 'vip' || type === 'business') && !isBooked && (
                <div className="absolute top-0.5 right-0.5">
                    {type === 'vip' ? (
                        <Crown className="w-3 h-3 opacity-80" />
                    ) : (
                        <Sparkles className="w-3 h-3 opacity-80" />
                    )}
                </div>
            )}
        </button>
    );
}
