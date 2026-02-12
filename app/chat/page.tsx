"use client";

import { useCallback, useState, useRef } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/chat/Sidebar";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Menu, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useBookings, BookingRecord } from "@/lib/services/booking-context";
import { sendMessage as newSendMessage } from "@/app/actions/chat";

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string>("");
    const conversationHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

    const {
        state,
        addMessage,
        setLoading,
    } = useChatContext();

    const { addBooking } = useBookings();

    const handleSend = useCallback(async (text: string) => {
        if (!text.trim()) return;

        // Add user message to UI
        addMessage(text, "user");
        setLoading(true);

        try {
            console.log("[Chat] Sending message:", text);

            // Call new system with full conversation history
            const response = await newSendMessage(
                text,
                conversationId,
                conversationHistoryRef.current
            );

            console.log("[Chat] Response received:", response);

            // Store conversation ID
            if (response.conversationId && !conversationId) {
                setConversationId(response.conversationId);
            }

            // Update conversation history
            conversationHistoryRef.current = [
                ...conversationHistoryRef.current,
                { role: "user", content: text },
                { role: "assistant", content: response.content }
            ];

            // Add AI response with options and quick replies
            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });

            // Handle booking if created
            if (response.booking?.success && response.booking.bookingId) {
                const bookingId = response.booking.bookingId;
                const bookingData = response.booking.details || {};

                const newRecord: BookingRecord = {
                    id: bookingId,
                    serviceId: bookingData.serviceId || bookingId,
                    type: response.bookingType || "unknown",
                    title: bookingData.movie_name ||
                        bookingData.service_type ||
                        bookingData.doctor_specialty ||
                        "Service",
                    subtitle: bookingData.cinema ||
                        bookingData.salon_name ||
                        bookingData.clinic_name ||
                        "",
                    date: new Date(bookingData.showtime ||
                        bookingData.appointment_date ||
                        new Date()),
                    status: "Confirmed",
                    amount: `NPR ${bookingData.total_price || 0}`,
                    details: bookingData
                };

                await addBooking(newRecord);

                const receiptData = {
                    id: bookingId,
                    serviceName: newRecord.title,
                    location: newRecord.subtitle,
                    date: newRecord.date.toLocaleDateString(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: newRecord.amount,
                    status: "Confirmed" as const,
                    userName: state.userProfile?.name || "Guest",
                    userPhone: state.userProfile?.phone || "N/A",
                    timestamp: new Date().toISOString()
                };

                addMessage(
                    `🎉 Booking confirmed! ID: **${bookingId}**`,
                    "assistant",
                    { receipt: receiptData }
                );
            }

        } catch (error: any) {
            console.error("[Chat] Error:", error);

            const errorMessage = error.message === 'Request timeout'
                ? "Sorry, the request took too long. Please try again."
                : "Sorry, something went wrong. Please try again.";

            addMessage(errorMessage, "assistant");
        } finally {
            setLoading(false);
        }
    }, [conversationId, addMessage, setLoading, addBooking, state.userProfile]);

    const handleOptionSelect = useCallback(async (option: BookingOption) => {
        await handleSend(option.title);
    }, [handleSend]);

    const handleNewChat = () => {
        setConversationId("");
        conversationHistoryRef.current = [];
        setSidebarOpen(false);
    };

    return (
        <div className="h-dvh flex overflow-hidden bg-background">
            <div className="hidden lg:block w-[260px] shrink-0 border-r border-border overflow-y-auto">
                <Sidebar
                    isOpen={true}
                    onClose={() => { }}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden h-14 bg-background border-b border-border flex items-center px-4 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="h-9 w-9 -ml-2"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 ml-2">
                        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                            <HeartHandshake className="w-4 h-4 text-primary-foreground" strokeWidth={1.5} />
                        </div>
                        <span className="font-semibold text-sm">Sahara</span>
                    </div>
                    <div className="ml-auto">
                        <Link href="/profile">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                                BA
                            </div>
                        </Link>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <ChatContainer 
                        onOptionSelect={handleOptionSelect}
                        onSend={handleSend}
                    />
                </div>

                <ChatInput
                    onSend={handleSend}
                    disabled={state.isLoading}
                    placeholder="Message Sahara..."
                />
            </div>

            <OnboardingModal />
        </div>
    );
}