"use client";

import { Avatar } from "@/components/ui/avatar";
import { HeartHandshake } from "lucide-react";

export function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4 animate-slide-in-left">
            {/* Bot Avatar */}
            <Avatar className="h-8 w-8 flex items-center justify-center bg-muted border border-border shrink-0">
                <HeartHandshake className="h-4 w-4 text-primary animate-heartbeat" strokeWidth={1.5} />
            </Avatar>

            {/* Typing Animation */}
            <div className="px-4 py-3 bg-muted rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5 items-center h-5">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing-dot animate-typing-dot-1" />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing-dot animate-typing-dot-2" />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-typing-dot animate-typing-dot-3" />
                </div>
            </div>
        </div>
    );
}
