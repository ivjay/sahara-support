"use client";

import { useRef, useEffect } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { Bus, Plane, Calendar, Ticket, MessageSquare } from "lucide-react";
import { QRCodeCard } from "./QRCodeCard";

interface ChatContainerProps {
    onOptionSelect?: (option: BookingOption) => void;
    onSend?: (text: string) => void;
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

export function ChatContainer({ onOptionSelect, onSend }: ChatContainerProps) {
    const { state } = useChatContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.messages, state.isLoading]);

    // Handle suggestion click
    const handleSuggestionClick = (text: string) => {
        if (onSend) {
            onSend(text);
        }
    };

    return (
        <div
            className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth min-h-0 relative"
            ref={scrollRef}
        >
            {/* Vibrant Animated Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Large gradient orbs with animation */}
                <div className="absolute top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-chart-2/15 to-chart-3/10 dark:from-primary/15 dark:via-chart-2/10 dark:to-chart-3/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-20 -right-20 w-[700px] h-[700px] bg-gradient-to-tl from-chart-3/20 via-primary/15 to-chart-2/10 dark:from-chart-3/15 dark:via-primary/10 dark:to-chart-2/5 rounded-full blur-[120px] float-smooth" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-accent/10 to-primary/10 dark:from-accent/5 dark:to-primary/5 rounded-full blur-[100px]" />

                {/* Animated gradient mesh */}
                <div
                    className="absolute inset-0 opacity-[0.08] dark:opacity-[0.04]"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 20% 50%, oklch(0.75 0.20 260 / 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, oklch(0.70 0.22 280 / 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, oklch(0.65 0.24 300 / 0.3) 0%, transparent 50%)
                        `,
                    }}
                />
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 relative">
                {/* Welcome state */}
                {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-12 animate-fade-in-up">
                        {/* Vibrant welcome icon */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-chart-2/20 to-chart-3/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-chart-2 to-chart-3 flex items-center justify-center shadow-2xl shadow-primary/40 neon-glow">
                                <MessageSquare className="w-12 h-12 text-white" strokeWidth={2} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-3 text-gradient-vibrant">
                            Hey {state.userProfile?.firstName || "there"}! 👋
                        </h2>
                        <p className="text-lg text-muted-foreground mb-2">
                            What can I help you with today?
                        </p>
                        <p className="text-sm text-muted-foreground/70 mb-10 max-w-md">
                            Book tickets, schedule appointments, or find services - I've got you covered!
                        </p>

                        {/* Vibrant suggestion cards */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                            {suggestions.map(({ icon: Icon, text, color }, index) => (
                                <button
                                    key={text}
                                    onClick={() => handleSuggestionClick(text)}
                                    className="group relative flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border/30 hover:border-primary/50 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 text-left card-lift overflow-hidden"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-chart-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className={`relative w-12 h-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md backdrop-blur-sm`}>
                                        <Icon className="h-6 w-6" strokeWidth={2.5} />
                                    </div>
                                    <span className="relative text-base font-semibold">{text}</span>

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 shimmer-vibrant opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Message List */}
                {state.messages.map((message) => (
                    <div key={message.id}>
                        <ChatMessage message={message} />

                        {/* Show options if present - Grid Layout (Hide during verification) */}
                        {message.options && message.options.length > 0 && !message.content?.includes("Verifying") && (
                            <div className="ml-12 mb-6 max-w-2xl">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {message.options.map((option) => (
                                        option.type === 'payment_qr' ? (
                                            <div className="col-span-1 sm:col-span-2" key={option.id}>
                                                <QRCodeCard option={option} />
                                            </div>
                                        ) : (
                                            <OptionCard
                                                key={option.id}
                                                option={option}
                                                onSelect={onOptionSelect || (() => { })}
                                            />
                                        )
                                    ))}
                                </div>
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