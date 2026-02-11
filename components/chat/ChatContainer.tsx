"use client";

import { useRef, useEffect } from "react";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/lib/chat/chat-context";
import { useServices } from "@/lib/services/service-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { Bus, Plane, Calendar, Ticket } from "lucide-react";
import { CURRENT_USER } from "@/lib/user-context";
import { QRCodeCard } from "./QRCodeCard";

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
    const { services } = useServices();
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
            const response = await processMessage(text, state.currentBooking, services);
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
            className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth min-h-0 relative"
            ref={scrollRef}
        >
            {/* Subtle Backdrop Decorations - Enhanced for light mode */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                {/* Gradient orbs - More visible in light mode */}
                <div className="absolute top-20 -left-20 w-80 h-80 bg-primary/15 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-40 -right-20 w-96 h-96 bg-chart-2/15 dark:bg-chart-2/5 rounded-full blur-[100px]" />

                {/* Subtle dot pattern - More visible in light mode */}
                <div
                    className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 relative">
                {/* Welcome state */}
                {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-8 animate-fade-in-up">
                        <WelcomeIllustration />

                        <h2 className="text-2xl font-bold mb-2 text-gradient">
                            How can I help you, {state.userProfile?.firstName || "Guest"}?
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-sm">
                            I'm <span className="font-semibold text-foreground">Sahara</span>, your personal AI assistant for bookings and services.
                        </p>

                        {/* Suggestion buttons - Enhanced */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                            {suggestions.map(({ icon: Icon, text, color }, index) => (
                                <button
                                    key={text}
                                    onClick={() => handleSuggestionClick(text)}
                                    className="group flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300 text-left"
                                    style={{ animationDelay: `${index * 75}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm font-medium">{text}</span>
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
                        {message.options && message.options.length > 0 && !message.content.includes("Verifying") && (
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
