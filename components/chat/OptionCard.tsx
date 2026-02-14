"use client";

import { BookingOption } from "@/lib/chat/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Plane, Calendar, Film, Stethoscope, CreditCard, Wallet } from "lucide-react";

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
            className="p-4 hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
        >
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    {/* Title & Rating */}
                    <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-sm">{option.title}</h4>
                        {option.details?.rating && (
                            <span className="text-xs ml-2 shrink-0">{option.details.rating}</span>
                        )}
                    </div>

                    {/* Subtitle/Specialty */}
                    <p className="text-xs text-muted-foreground mb-2">{option.subtitle}</p>

                    {/* Hospital & Address - SEO Style */}
                    {option.details?.hospital && (
                        <div className="mb-2">
                            <p className="text-xs font-medium text-foreground">{option.details.hospital}</p>
                            {option.details?.address && (
                                <p className="text-[10px] text-muted-foreground">
                                    📍 {option.details.address}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Phone Number */}
                    {option.details?.phone && (
                        <p className="text-[10px] text-muted-foreground mb-2">
                            📞 {option.details.phone}
                        </p>
                    )}

                    {/* Next Slot */}
                    {option.details?.nextSlot && (
                        <p className="text-[10px] text-green-600 mb-1">
                            ⏰ Available: {option.details.nextSlot}
                        </p>
                    )}

                    {/* Price */}
                    {option.price > 0 && (
                        <p className="text-sm font-bold text-primary mt-2">
                            {option.currency} {option.price}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}