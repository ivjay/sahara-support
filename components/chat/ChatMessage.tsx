"use client";

import { Message } from "@/lib/chat/types";
import { Avatar } from "@/components/ui/avatar";
import { formatTime } from "@/lib/chat/utils";
import { cn } from "@/lib/utils";
import { User, HeartHandshake, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";
    const [showActions, setShowActions] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content);
    };

    return (
        <div
            className={cn(
                "group flex gap-4 mb-6",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar */}
            <Avatar className={cn(
                "h-8 w-8 flex items-center justify-center shrink-0",
                isUser
                    ? "bg-primary"
                    : "bg-muted border border-border"
            )}>
                {isUser ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                    <HeartHandshake className="h-4 w-4 text-primary" strokeWidth={1.5} />
                )}
            </Avatar>

            {/* Message Content */}
            <div className={cn("flex flex-col max-w-[80%] lg:max-w-[70%]", isUser && "items-end")}>
                {/* Sender name */}
                <span className="text-[11px] text-muted-foreground mb-1 px-1">
                    {isUser ? "You" : "Sahara"}
                </span>

                <div
                    className={cn(
                        "px-4 py-3 rounded-2xl text-[15px] leading-relaxed",
                        isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                    )}
                >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {/* Actions for assistant messages */}
                {!isUser && (
                    <div className={cn(
                        "flex items-center gap-1 mt-1.5 transition-opacity duration-200",
                        showActions ? "opacity-100" : "opacity-0"
                    )}>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={copyToClipboard}
                        >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <span className="text-[10px] text-muted-foreground ml-2">
                            {formatTime(message.timestamp)}
                        </span>
                    </div>
                )}

                {/* Timestamp for user messages */}
                {isUser && (
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {formatTime(message.timestamp)}
                    </span>
                )}
            </div>
        </div>
    );
}
