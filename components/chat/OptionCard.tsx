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
            className="p-4 cursor-pointer hover:border-primary hover:shadow-md transition-all overflow-hidden"
        >
            {/* Movie poster banner */}
            {option.type === "movie" && option.details?.imageUrl && (
                <div className="relative -mx-4 -mt-4 mb-3 h-32 overflow-hidden">
                    <img
                        src={option.details.imageUrl}
                        alt={option.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                </div>
            )}
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
                    <p className="text-xs text-muted-foreground mb-1">{option.subtitle}</p>

                    {/* Description (if available) */}
                    {option.description && (
                        <p className="text-[11px] text-muted-foreground/80 mb-2">{option.description}</p>
                    )}

                    {/* BUSES & FLIGHTS - Route & Departure */}
                    {(option.type === 'bus' || option.type === 'flight') && (
                        <div className="mb-2 space-y-1">
                            {option.details?.from && option.details?.to && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{option.details.from} → {option.details.to}</span>
                                </div>
                            )}
                            {option.details?.departure && (
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>Departs: {option.details.departure}</span>
                                    {option.details?.duration && <span className="text-[10px]">({option.details.duration})</span>}
                                </div>
                            )}
                            {option.details?.busType && (
                                <p className="text-[10px] text-muted-foreground">Bus: {option.details.busType}</p>
                            )}
                            {option.details?.aircraft && (
                                <p className="text-[10px] text-muted-foreground">Aircraft: {option.details.aircraft}</p>
                            )}
                        </div>
                    )}

                    {/* MOVIES - Cinema & Showtime */}
                    {option.type === 'movie' && (
                        <div className="mb-2 space-y-1">
                            {option.details?.cinema && (
                                <div className="flex items-center gap-1 text-xs font-medium">
                                    <MapPin className="h-3 w-3" />
                                    <span>{option.details.cinema}</span>
                                </div>
                            )}
                            {option.details?.showtime && (
                                <div className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                                    <Clock className="h-3 w-3" />
                                    <span>Showtime: {option.details.showtime}</span>
                                    {option.details?.duration && <span className="text-[10px]">({option.details.duration})</span>}
                                </div>
                            )}
                            {option.details?.language && (
                                <p className="text-[10px] text-muted-foreground">
                                    {option.details.language} • {option.details?.format || '2D'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* DOCTORS - Hospital & Address */}
                    {option.type === 'appointment' && option.details?.hospital && (
                        <div className="mb-2 space-y-0.5">
                            <p className="text-xs font-medium">{option.details.hospital}</p>
                            {option.details?.address && (
                                <div className="flex items-start gap-1 text-[10px] text-muted-foreground">
                                    <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                    <span>{option.details.address}</span>
                                </div>
                            )}
                            {option.details?.phone && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span>{option.details.phone}</span>
                                </div>
                            )}
                            {option.details?.nextSlot && (
                                <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded w-fit mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Available: {option.details.nextSlot}</span>
                                </div>
                            )}
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