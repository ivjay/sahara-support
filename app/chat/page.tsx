"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { useServices } from "@/lib/services/service-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/chat/Sidebar";
import { processMessage, handleOptionSelection } from "@/lib/chat/agent";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Menu, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { BookingSuccessModal } from "@/components/booking/BookingSuccessModal";
import { useBookings, BookingRecord } from "@/lib/services/booking-context";
import { generateId } from "@/lib/chat/utils"; // Ensure utils is imported or use uuid if needed, likely existing import elsewhere or use date

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { services } = useServices();
    const {
        state,
        addMessage,
        setLoading,
        setBooking,
    } = useChatContext();

    const { addBooking } = useBookings();

    // Track saved state to prevent duplicates during the same session
    const [lastSavedBooking, setLastSavedBooking] = useState<string | null>(null);

    // Track if we are currently saving to avoid race conditions
    const isSavingRef = useRef(false);

    // Auto-save and handle status changes
    useEffect(() => {
        const booking = state.currentBooking;

        if (!booking) {
            setLastSavedBooking(null);
            return;
        }

        const handlePendingVerification = async () => {
            // 1. Handle "Pending Verification" (User clicked 'I have paid')
            if (booking.collectedData.verificationPending === "true" && !booking.isComplete) {
                // Check local saved state to prevent duplicates
                if (booking.collectedData.bookingRefId) return; // Already saved
                if (isSavingRef.current) return;

                isSavingRef.current = true;

                try {
                    const generatedId = `bk-${Date.now()}`;
                    const title = booking.collectedData.specialist || booking.collectedData.movie || booking.collectedData.to || "Service Booking";
                    const subtitle = booking.collectedData.hospital || booking.collectedData.theater || booking.collectedData.from || booking.intent;

                    // Save as Pending
                    const newRecord: BookingRecord = {
                        id: generatedId,
                        serviceId: booking.collectedData.serviceId,
                        type: booking.intent,
                        title: title,
                        subtitle: subtitle,
                        date: new Date(),
                        status: "Pending", // Admin needs to verify this
                        amount: booking.collectedData.price || "Paid",
                        details: booking.collectedData
                    };

                    console.log("[Chat] Saving Pending Booking:", newRecord);
                    await addBooking(newRecord);

                    // Update active state with the ID so we can track it
                    setBooking({
                        ...booking,
                        collectedData: {
                            ...booking.collectedData,
                            bookingRefId: generatedId
                        }
                    });
                } finally {
                    isSavingRef.current = false;
                }
            }
        };

        const handleCompletion = async () => {
            // 2. Handle "Complete" / "Pay at Counter" (Instant)
            if (booking.isComplete) {
                const bookingSignature = JSON.stringify(booking.collectedData);
                if (lastSavedBooking === bookingSignature) return;

                // Prevent duplicate processing if signature matches
                if (isSavingRef.current) return;
                isSavingRef.current = true;

                try {
                    const title = booking.collectedData.specialist || booking.collectedData.movie || booking.collectedData.to || "Service Booking";
                    const subtitle = booking.collectedData.hospital || booking.collectedData.theater || booking.collectedData.from || booking.intent;

                    const status = booking.collectedData.cash === "true" ? "Pending Payment" : "Confirmed";

                    const newRecord: BookingRecord = {
                        id: `bk-${Date.now()}`,
                        serviceId: booking.collectedData.serviceId,
                        type: booking.intent,
                        title: title,
                        subtitle: subtitle,
                        date: new Date(),
                        status: status,
                        amount: booking.collectedData.price || "Paid",
                        details: booking.collectedData
                    };

                    console.log("[Chat] Saving Completed Booking:", newRecord);
                    await addBooking(newRecord);
                    setLastSavedBooking(bookingSignature);

                    // Send Inline Receipt Message
                    const receiptData = {
                        id: newRecord.id.split('-')[1].toUpperCase(), // Short ID
                        serviceName: title,
                        location: subtitle,
                        date: new Date().toLocaleDateString(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        price: newRecord.amount,
                        status: newRecord.status as "Confirmed" | "Pending Payment", // ✅ Use actual status from booking
                        userName: state.userProfile?.name || "Guest",
                        userPhone: state.userProfile?.phone || "N/A",
                        timestamp: new Date().toISOString()
                    };

                    const confirmMsg = status === "Confirmed"
                        ? `🎉 **Payment Successful!**\n\nYour visit at **${title}** on **${new Date().toLocaleDateString()}** is confirmed.\n\nHere is your e-ticket:`
                        : `✅ **Booking Confirmed!**\n\nYour Reservation at **${title}** is confirmed.\n\nPlease pay at the counter. Here is your receipt:`;

                    addMessage(
                        confirmMsg,
                        "assistant",
                        { receipt: receiptData }
                    );
                } finally {
                    isSavingRef.current = false;
                }
            }
        };

        handlePendingVerification();
        handleCompletion();

    }, [state.currentBooking, addBooking, lastSavedBooking, addMessage, state.userProfile, setBooking]);

    // Listener for Admin Verification (Watch 'bookings' context)
    const { bookings } = useBookings();
    const [notifiedBookings, setNotifiedBookings] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Find bookings that were "Pending" but are now "Confirmed"
        bookings.forEach(b => {
            // Check if this booking matches the "Waiting" booking in our chat state
            const currentRefId = state.currentBooking?.collectedData?.bookingRefId;

            if (currentRefId && b.id === currentRefId && b.status === "Confirmed") {
                // If we haven't notified yet
                if (!notifiedBookings.has(b.id)) {
                    const receiptData = {
                        id: b.id.split('-')[1].toUpperCase(),
                        serviceName: b.title,
                        location: b.subtitle,
                        date: new Date(b.date).toLocaleDateString(),
                        time: new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        price: b.amount,
                        status: "Confirmed",
                        userName: state.userProfile?.name || "Guest",
                        userPhone: state.userProfile?.phone || "N/A",
                        timestamp: new Date().toISOString()
                    };

                    addMessage(
                        `🎉 **Payment Verified!**\n\nYour visit at **${b.title}** is fully confirmed.\n\nHere is your updated e-ticket:`,
                        "assistant",
                        { receipt: receiptData }
                    );

                    setNotifiedBookings(prev => new Set(prev).add(b.id));

                    // Update state to Complete to stop waiting
                    setBooking({
                        ...state.currentBooking!,
                        isComplete: true, // This stops the 'pending' checks
                        collectedData: {
                            ...state.currentBooking!.collectedData,
                            verificationPending: "false"
                        }
                    });
                }
            }
        });
    }, [bookings, notifiedBookings, addMessage, state.currentBooking, setBooking, state.userProfile]);

    // Handle sending message
    const handleSend = useCallback(async (text: string) => {
        addMessage(text, "user");
        setLoading(true);

        try {
            const response = await processMessage(text, state.currentBooking, services);

            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });

            if (response.newBookingState !== undefined) {
                setBooking(response.newBookingState);
            }
        } catch (error) {
            addMessage(
                "Sorry, something went wrong. Please try again.",
                "assistant"
            );
        } finally {
            setLoading(false);
        }
    }, [state.currentBooking, services, addMessage, setLoading, setBooking]);

    // Handle option selection
    const handleOptionSelect = useCallback(async (option: BookingOption) => {
        addMessage(`I'll take "${option.title}"`, "user");
        setLoading(true);

        try {
            const response = await handleOptionSelection(option, state.currentBooking);

            // 1. Update Booking State (Merge logic)
            if (response.newBookingState) {
                // If the new state is "Complete" (like Pay at Counter), it might come empty from Agent.
                // We must preserve the existing collected data.
                const prev = state.currentBooking;
                const mergedData = {
                    ...(prev?.collectedData || {}),
                    ...(response.newBookingState?.collectedData || {})
                };

                const mergedState = {
                    ...response.newBookingState!,
                    collectedData: mergedData, // Use the preserved/merged data
                    intent: prev?.intent || response.newBookingState!.intent || "UNKNOWN"// Preserve intent if needed
                };

                setBooking(mergedState);
            }

            // 2. Add Message (which renders the QR Card or Receipt)
            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });
        } catch (error) {
            addMessage("Sorry, couldn't process your selection.", "assistant");
        } finally {
            setLoading(false);
        }
    }, [addMessage, setLoading, setBooking, state.currentBooking]);

    const handleNewChat = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="h-dvh flex overflow-hidden bg-background">
            {/* Sidebar - visible on desktop, slide-over on mobile */}
            <div className="hidden lg:block w-[260px] shrink-0 border-r border-border overflow-y-auto">
                <Sidebar
                    isOpen={true}
                    onClose={() => { }}
                    onNewChat={handleNewChat}
                />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={handleNewChat}
                />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
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
                    {/* Mobile Profile Link */}
                    <div className="ml-auto">
                        <Link href="/profile">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                                BA
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Chat Container - This scrolls */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <ChatContainer onOptionSelect={handleOptionSelect} />
                </div>

                {/* Input - Fixed at bottom */}
                <ChatInput
                    onSend={handleSend}
                    disabled={state.isLoading}
                    placeholder={
                        state.currentBooking
                            ? "Type your answer..."
                            : "Message Sahara..."
                    }
                />
            </div>

            {/* Onboarding Modal - Shows for first-time users */}
            <OnboardingModal />

            {/* Booking Success Modal - REMOVED (Replaced by Inline Receipt) */}
            {/* {state.currentBooking?.isComplete && (
                <BookingSuccessModal
                    booking={state.currentBooking}
                    onClose={() => setBooking(null)}
                />
            )} */}
        </div>
    );
}
