"use client";

import { useRef, useEffect } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { Bus, Plane, Calendar, Ticket, MessageSquare } from "lucide-react";
import { QRCodeCard } from "./QRCodeCard";
import { ChatSeatPicker } from "./ChatSeatPicker";

interface ChatContainerProps {
    onOptionSelect?: (option: BookingOption) => void;
    onSend?: (text: string) => void;
}

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
            className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth min-h-0"
            ref={scrollRef}
        >
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Welcome state */}
                {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-12">
                        {/* Simple welcome icon */}
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>

                        <h2 className="text-2xl font-bold mb-2">
                            Hi {state.userProfile?.firstName || "there"}! 👋
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md">
                            I'm Sahara, your friendly booking assistant. How can I help you today?
                        </p>

                        {/* Simple suggestion cards */}
                        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                            {suggestions.map(({ icon: Icon, text, color }) => (
                                <button
                                    key={text}
                                    onClick={() => handleSuggestionClick(text)}
                                    className="flex items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
                                >
                                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
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

                        {/* Seat Selection in Chat */}
                        {message.seatSelection && (
                            <div className="ml-12 mb-6">
                                <ChatSeatPicker
                                    venueId={message.seatSelection.venueId}
                                    serviceId={message.seatSelection.serviceId}
                                    eventDate={message.seatSelection.eventDate}
                                    eventTime={message.seatSelection.eventTime}
                                    onSelectionComplete={(seats) => {
                                        if (onSend) {
                                            onSend(`I've selected these seats: ${seats.join(', ')}`);
                                        }
                                    }}
                                    onCancel={() => {
                                        if (onSend) {
                                            onSend("I changed my mind about the seats.");
                                        }
                                    }}
                                />
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