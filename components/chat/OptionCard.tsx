"use client";

import { BookingOption } from "@/lib/chat/types";
import { Card } from "@/components/ui/card";
import { Bus, Plane, Calendar, Film, Stethoscope, CreditCard, Wallet, MapPin, Phone, Clock } from "lucide-react";

interface OptionCardProps {
    option: BookingOption;
    onSelect: (option: BookingOption) => void;
}

export function OptionCard({ option, onSelect }: OptionCardProps) {
    const getIcon = () => {
        switch (option.type) {
            case "bus": return <Bus className="h-5 w-5" />;
            case "flight": return <Plane className="h-5 w-5" />;
            case "movie": return <Film className="h-5 w-5" />;
            case "appointment": return <Stethoscope className="h-5 w-5" />;
            case "payment_qr": return <CreditCard className="h-5 w-5" />;
            case "payment_cash": return <Wallet className="h-5 w-5" />;
            default: return <Calendar className="h-5 w-5" />;
        }
    };

    return (
        <Card
            onClick={() => onSelect(option)}
            className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all"
        >
            <div className="flex items-start gap-3">
                {/* Simple icon */}
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title & Rating */}
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{option.title}</h4>
                        {option.details?.rating && (
                            <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                ⭐ {option.details.rating}
                            </span>
                        )}
                    </div>

                    {/* Subtitle */}
                    <p className="text-xs text-muted-foreground mb-2">{option.subtitle}</p>

                    {/* Hospital & Address */}
                    {option.details?.hospital && (
                        <div className="mb-2 space-y-0.5">
                            <p className="text-xs font-medium">{option.details.hospital}</p>
                            {option.details?.address && (
                                <div className="flex items-start gap-1 text-[10px] text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                    <span>{option.details.address}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phone */}
                    {option.details?.phone && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                            <Phone className="h-3 w-3" />
                            <span>{option.details.phone}</span>
                        </div>
                    )}

                    {/* Next Slot */}
                    {option.details?.nextSlot && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded w-fit mb-2">
                            <Clock className="h-3 w-3" />
                            <span>Available: {option.details.nextSlot}</span>
                        </div>
                    )}

                    {/* Price */}
                    {option.price > 0 && (
                        <div className="flex items-baseline gap-2 mt-2 pt-2 border-t">
                            <span className="text-sm font-bold text-primary">
                                {option.currency} {option.price}
                            </span>
                            <span className="text-xs text-muted-foreground">per person</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}