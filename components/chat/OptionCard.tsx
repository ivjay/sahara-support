"use client";

import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
    option: BookingOption;
    onSelect: (option: BookingOption) => void;
}

export function OptionCard({ option, onSelect }: OptionCardProps) {
    return (
        <div
            className={cn(
                "group relative p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30",
                "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
                "cursor-pointer overflow-hidden"
            )}
            onClick={() => option.available && onSelect(option)}
        >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10 group-hover:bg-primary/10 transition-colors" />

            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[15px] group-hover:text-primary transition-colors">
                            {option.title}
                        </h4>
                        {option.available && (
                            <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 border-0 px-1.5 py-0">
                                Available
                            </Badge>
                        )}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{option.subtitle}</p>
                </div>
                {option.price && (
                    <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                            {option.currency} {option.price}
                        </div>
                        <p className="text-[10px] text-muted-foreground">per person</p>
                    </div>
                )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-muted/50">
                {Object.entries(option.details).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-background flex items-center justify-center">
                            {key.toLowerCase().includes('time') ? (
                                <Clock className="h-3 w-3 text-muted-foreground" />
                            ) : key.toLowerCase().includes('seat') || key.toLowerCase().includes('type') ? (
                                <Star className="h-3 w-3 text-muted-foreground" />
                            ) : (
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground capitalize leading-none">{key}</p>
                            <p className="text-[12px] font-medium">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <Button
                size="sm"
                className="w-full gap-2 h-10 rounded-lg group-hover:shadow-md transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(option);
                }}
                disabled={!option.available}
            >
                {option.available ? (
                    <>
                        Book Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                ) : (
                    "Not Available"
                )}
            </Button>
        </div>
    );
}
