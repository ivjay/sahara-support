"use client";

import { useRef, useEffect } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { Bus, Plane, Calendar, Ticket } from "lucide-react";

interface ChatContainerProps {
    onOptionSelect?: (option: BookingOption) => void;
}

// SVG Illustration for welcome state
const WelcomeIllustration = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
        {/* Background circle */}
        <circle cx="60" cy="60" r="55" fill="currentColor" className="text-primary/10" />
        <circle cx="60" cy="60" r="40" fill="currentColor" className="text-primary/20" />

        {/* Chat bubble 1 */}
        <rect x="30" y="35" width="35" height="20" rx="10" fill="currentColor" className="text-primary" />
        <circle cx="40" cy="45" r="2" fill="white" />
        <circle cx="47" cy="45" r="2" fill="white" />
        <circle cx="54" cy="45" r="2" fill="white" />

        {/* Chat bubble 2 */}
        <rect x="55" y="60" width="35" height="25" rx="10" fill="currentColor" className="text-muted-foreground/30" />
        <rect x="62" y="68" width="20" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/50" />
        <rect x="62" y="74" width="14" height="3" rx="1.5" fill="currentColor" className="text-muted-foreground/50" />

        {/* Decorative dots */}
        <circle cx="25" cy="75" r="4" fill="currentColor" className="text-chart-2/40" />
        <circle cx="95" cy="35" r="3" fill="currentColor" className="text-chart-3/40" />
        <circle cx="85" cy="90" r="5" fill="currentColor" className="text-primary/30" />
    </svg>
);

const suggestions = [
    { icon: Bus, text: "Book a bus ticket", color: "bg-orange-500/10 text-orange-600" },
    { icon: Plane, text: "Find a flight", color: "bg-blue-500/10 text-blue-600" },
    { icon: Calendar, text: "Schedule appointment", color: "bg-green-500/10 text-green-600" },
    { icon: Ticket, text: "Movie tickets", color: "bg-purple-500/10 text-purple-600" },
];

export function ChatContainer({ onOptionSelect }: ChatContainerProps) {
    const { state, addMessage, setLoading } = useChatContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.messages, state.isLoading]);

    // Handle suggestion click
    const handleSuggestionClick = async (text: string) => {
        // Import and use processMessage
        const { processMessage, getWelcomeMessage } = await import("@/lib/chat/agent");

        addMessage(text, "user");
        setLoading(true);

        try {
            const response = await processMessage(text, state.currentBooking);
            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });
        } catch (error) {
            addMessage("Sorry, something went wrong. Please try again.", "assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth min-h-0"
            ref={scrollRef}
        >
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Welcome state */}
                {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <WelcomeIllustration />

                        <h2 className="text-2xl font-bold mb-2">
                            How can I help you?
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-sm">
                            I'm Sahara, your AI assistant for bookings and services.
                        </p>

                        {/* Suggestion buttons */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                            {suggestions.map(({ icon: Icon, text, color }) => (
                                <button
                                    key={text}
                                    onClick={() => handleSuggestionClick(text)}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all text-left"
                                >
                                    <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className="text-[13px] font-medium">{text}</span>
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
                            <div className="ml-12 mb-6 space-y-3 max-w-lg">
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
        </div>
    );
}
