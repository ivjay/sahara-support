"use client";

import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OptionCardProps {
    option: BookingOption;
    onSelect: (option: BookingOption) => void;
}

export function OptionCard({ option, onSelect }: OptionCardProps) {
    const [isSelecting, setIsSelecting] = useState(false);

    const handleSelect = () => {
        setIsSelecting(true);
        // Small delay for animation
        setTimeout(() => {
            onSelect(option);
            setIsSelecting(false);
        }, 200);
    };

    return (
        <div
            className={cn(
                "p-4 rounded-xl border border-border bg-card animate-pop-in",
                "hover:border-primary/40 hover:shadow-lg hover-lift transition-all duration-200",
                option.available ? "cursor-pointer" : "opacity-60",
                isSelecting && "scale-[0.98] border-primary"
            )}
            onClick={() => option.available && handleSelect()}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[14px] truncate">
                            {option.title}
                        </h4>
                        {option.available && (
                            <Sparkles className="h-3.5 w-3.5 text-primary/60" />
                        )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{option.subtitle}</p>
                </div>
                {option.price && (
                    <Badge className="bg-primary/10 text-primary border-0 text-[13px] font-bold shrink-0 hover:bg-primary/20 transition-colors">
                        {option.currency} {option.price}
                    </Badge>
                )}
            </div>



            {/* Action Button */}
            <Button
                size="sm"
                className={cn(
                    "w-full gap-2 h-9 rounded-lg transition-all",
                    isSelecting && "animate-pulse-glow"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    handleSelect();
                }}
                disabled={!option.available}
            >
                <Check className={cn("w-4 h-4 transition-transform", isSelecting && "scale-110")} />
                {option.available ? "Select" : "Not Available"}
            </Button>
        </div>
    );
}
