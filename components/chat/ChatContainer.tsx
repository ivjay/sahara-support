"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { HeartHandshake, Bus, Plane, Calendar, Ticket } from "lucide-react";

interface ChatContainerProps {
    onOptionSelect?: (option: BookingOption) => void;
}

const suggestions = [
    { icon: Bus, text: "Book a bus to Pokhara", color: "from-orange-500/10 to-orange-500/5" },
    { icon: Plane, text: "Find flights to Delhi", color: "from-blue-500/10 to-blue-500/5" },
    { icon: Calendar, text: "Schedule a doctor visit", color: "from-green-500/10 to-green-500/5" },
    { icon: Ticket, text: "Movie tickets for today", color: "from-purple-500/10 to-purple-500/5" },
];

export function ChatContainer({ onOptionSelect }: ChatContainerProps) {
    const { state } = useChatContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.messages, state.isLoading]);

    return (
        <ScrollArea className="flex-1 scrollbar-thin" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Welcome state */}
                {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        {/* Icon with glow */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 w-20 h-20 bg-primary/30 rounded-2xl blur-xl" />
                            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20">
                                <HeartHandshake className="w-10 h-10 text-primary-foreground" strokeWidth={1.5} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-semibold mb-2">
                            How can I help you today?
                        </h2>
                        <p className="text-muted-foreground mb-10 max-w-md">
                            I'm Sahara, your AI assistant. Ask me about booking tickets, scheduling appointments, or anything else.
                        </p>

                        {/* Suggestion cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                            {suggestions.map(({ icon: Icon, text, color }) => (
                                <button
                                    key={text}
                                    className={`group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br ${color} border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-left`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="text-[14px] font-medium">{text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message List */}
                {state.messages.map((message) => (
                    <div key={message.id}>
                        <ChatMessage message={message} />

                        {/* Show options if present */}
                        {message.options && message.options.length > 0 && (
                            <div className="ml-12 mb-6 grid gap-3 max-w-xl">
                                {message.options.map((option) => (
                                    <OptionCard
                                        key={option.id}
                                        option={option}
                                        onSelect={onOptionSelect || (() => { })}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {state.isLoading && <TypingIndicator />}
            </div>
        </ScrollArea>
    );
}
