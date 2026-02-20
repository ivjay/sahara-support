"use client";

import { Button } from "@/components/ui/button";
const QUICK_ACTIONS = [
    "Book a bus ticket",
    "Find flights",
    "Doctor appointment",
    "Movie tickets",
];

interface QuickActionsProps {
    onSelect: (action: string) => void;
    disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
    return (
        <div className="px-4 pb-4">
            <div className="max-w-3xl mx-auto">
                <p className="text-xs text-muted-foreground mb-3">Quick actions</p>
                <div className="flex flex-wrap gap-2">
                    {QUICK_ACTIONS.map((action) => (
                        <Button
                            key={action}
                            variant="outline"
                            size="sm"
                            onClick={() => onSelect(action)}
                            disabled={disabled}
                            className="text-xs h-8"
                        >
                            {action}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
