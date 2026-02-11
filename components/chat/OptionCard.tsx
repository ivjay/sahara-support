"use client";

import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OptionCardProps {
    option: BookingOption;
    onSelect: (option: BookingOption) => void;
}

export function OptionCard({ option, onSelect }: OptionCardProps) {
    return (
        <button
            onClick={() => option.available && onSelect(option)}
            disabled={!option.available}
            className={cn(
                "w-full text-left p-3 rounded-lg border",
                "transition-colors duration-150",
                option.available
                    ? "border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950/30"
                    : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm mb-0.5">{option.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{option.subtitle}</p>
                </div>
                {option.price && (
                    <span className="text-sm font-semibold shrink-0">
                        {option.currency} {option.price}
                    </span>
                )}
            </div>
        </button>
    );
}