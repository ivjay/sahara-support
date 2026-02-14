"use client";

import { BookingOption } from "@/lib/chat/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
            className="relative p-5 cursor-pointer group overflow-hidden border-2 border-border/30 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/20 rounded-2xl transition-all duration-300 card-lift bg-gradient-to-br from-card via-card to-muted/20"
        >
            {/* Vibrant gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-chart-2/5 to-chart-3/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Animated orb decoration */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-primary/20 to-chart-2/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pulse-glow-vibrant" />

            <div className="flex items-start gap-4 relative z-10">
                {/* Vibrant icon with gradient */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-chart-2/15 to-chart-3/10 group-hover:from-primary/30 group-hover:via-chart-2/25 group-hover:to-chart-3/20 group-hover:scale-110 transition-all duration-300 shrink-0 shadow-lg neon-glow backdrop-blur-sm border border-primary/20">
                    <div className="text-primary group-hover:text-primary/90">
                        {getIcon()}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Title & Rating */}
                    <div className="flex items-start justify-between mb-1.5">
                        <h4 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{option.title}</h4>
                        {option.details?.rating && (
                            <span className="text-xs ml-2 shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/40 text-amber-700 dark:text-amber-300 font-bold shadow-md border border-amber-200 dark:border-amber-800/50">
                                ⭐ {option.details.rating}
                            </span>
                        )}
                    </div>

                    {/* Subtitle/Specialty */}
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{option.subtitle}</p>

                    {/* Hospital & Address */}
                    {option.details?.hospital && (
                        <div className="mb-2 space-y-1">
                            <p className="text-xs font-medium text-foreground">{option.details.hospital}</p>
                            {option.details?.address && (
                                <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0 mt-0.5 text-primary/60" />
                                    <span className="leading-tight">{option.details.address}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Phone Number */}
                    {option.details?.phone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                            <Phone className="h-3 w-3 text-primary/60" />
                            <span>{option.details.phone}</span>
                        </div>
                    )}

                    {/* Next Slot */}
                    {option.details?.nextSlot && (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-600 dark:text-green-500 mb-1.5 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-md w-fit">
                            <Clock className="h-3 w-3" />
                            <span className="font-medium">Available: {option.details.nextSlot}</span>
                        </div>
                    )}

                    {/* Price - Bold and vibrant */}
                    {option.price > 0 && (
                        <div className="flex items-baseline gap-2 mt-3 pt-3 border-t-2 border-gradient-to-r from-border/50 via-primary/20 to-border/50">
                            <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/30 shadow-md">
                                <span className="text-lg font-black text-gradient-vibrant">
                                    {option.currency} {option.price}
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground/70">per person</span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}