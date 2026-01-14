"use client";

import { Avatar } from "@/components/ui/avatar";
import { HeartHandshake } from "lucide-react";

export function TypingIndicator() {
    return (
        <div className="flex gap-4 mb-6">
            {/* Bot Avatar */}
            <Avatar className="h-8 w-8 flex items-center justify-center bg-muted border border-border shrink-0">
                <HeartHandshake className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </Avatar>

            {/* Typing Animation */}
            <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground mb-1 px-1">Sahara</span>
                <div className="px-4 py-3 bg-muted rounded-2xl">
                    <div className="flex gap-1 items-center h-5">
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
}
