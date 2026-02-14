"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/chat/Sidebar";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { LogoCompact, LogoIcon } from "@/components/ui/logo";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useBookings, BookingRecord } from "@/lib/services/booking-context";
import { sendMessage as newSendMessage } from "@/app/actions/chat";
import { handleOptionSelection } from "@/lib/chat/agent";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { BookingMethodSelector } from "@/components/booking/BookingMethodSelector";
import { needsWizard, getServiceType, generateSessionId } from "@/lib/booking/wizard-integration";

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string>("");
    const [pendingVerifications, setPendingVerifications] = useState<Set<string>>(new Set());
    const conversationHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

    // Booking Wizard state
    const [wizardState, setWizardState] = useState<{
        mode: 'selector' | 'wizard' | 'chat';
        service: BookingOption;
        serviceType: 'movie' | 'bus' | 'flight' | 'appointment';
    } | null>(null);
    const [sessionId] = useState(() => generateSessionId());

    const {
        state,
        addMessage,
        setLoading,
    } = useChatContext();

    const { addBooking } = useBookings();

    const handleSend = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage(text, "user");
        setLoading(true);

        try {
            console.log("[Chat] Sending message:", text);

            const response = await newSendMessage(
                text,
                conversationId,
                conversationHistoryRef.current
            );

            console.log("[Chat] Response received:", response);

            if (response.conversationId && !conversationId) {
                setConversationId(response.conversationId);
            }

            conversationHistoryRef.current = [
                ...conversationHistoryRef.current,
                { role: "user", content: text },
                { role: "assistant", content: response.content }
            ];

            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });

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

                if (newRecord.status === "Under Review") {
                    setPendingVerifications(prev => new Set(prev).add(bookingId));
                    return; // Skip celebration message for now
                }

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

    // ✅ FIX: Handle option selection properly
    const handleOptionSelect = useCallback(async (option: BookingOption) => {
        console.log("[Chat] Option selected:", option.title);

        // Check if this service needs the booking wizard/chat flow choice
        if (needsWizard(option)) {
            console.log("[Chat] 🎯 Showing booking method selector for:", option.type);
            setWizardState({
                mode: 'selector',
                service: option,
                serviceType: getServiceType(option)
            });
            return; // Don't proceed with normal flow
        }

        // Add user selection as message
        addMessage(`Selected: ${option.title}`, "user");
        setLoading(true);

        try {
            // Call the agent's option handler
            const agentResponse = await handleOptionSelection(option, state.currentBooking);

            console.log("[Chat] Agent response:", agentResponse);

            // Add AI response
            addMessage(agentResponse.content, "assistant", {
                options: agentResponse.options,
                quickReplies: agentResponse.quickReplies,
            });

            // Update booking state if needed
            if (agentResponse.newBookingState) {
                // Handle booking state update here if needed
            }

        } catch (error) {
            console.error("[Chat] Option selection error:", error);
            addMessage("Sorry, something went wrong. Please try again.", "assistant");
        } finally {
            setLoading(false);
        }
    }, [addMessage, setLoading, state.currentBooking]);

    // ✅ SMART POLLING: Only poll when waiting for admin verification
    const { bookings, refreshBookings } = useBookings();
    useEffect(() => {
        // Only poll if there are pending verifications
        if (pendingVerifications.size === 0) return;

        console.log(`[Chat] 👀 Watching ${pendingVerifications.size} pending verification(s)...`);

        // Poll every 5 seconds while waiting for admin
        const pollInterval = setInterval(async () => {
            console.log('[Chat] 🔄 Checking for admin verification...');
            await refreshBookings();
        }, 5000);

        return () => {
            console.log('[Chat] 🛑 Stopped polling');
            clearInterval(pollInterval);
        };
    }, [pendingVerifications.size, refreshBookings]);

    // Listen for admin confirmation
    useEffect(() => {
        if (pendingVerifications.size === 0) return;

        bookings.forEach(booking => {
            if (pendingVerifications.has(booking.id) && booking.status === "Confirmed") {
                console.log(`[Chat] ✅ Booking ${booking.id} confirmed by admin!`);

                setPendingVerifications(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(booking.id);
                    return newSet;
                });

                const receiptData = {
                    id: booking.id,
                    serviceName: booking.title,
                    location: booking.subtitle,
                    date: booking.date.toLocaleDateString(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    price: booking.amount,
                    status: "Confirmed" as const,
                    userName: state.userProfile?.name || "Guest",
                    userPhone: state.userProfile?.phone || "N/A",
                    timestamp: new Date().toISOString()
                };

                addMessage(
                    `✅ **Admin Verified!** Your payment for **${booking.title}** has been confirmed.`,
                    "assistant",
                    { receipt: receiptData }
                );
            }
        });
    }, [bookings, pendingVerifications, addMessage, state.userProfile]);

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
                <header className="lg:hidden h-16 bg-background/95 backdrop-blur-sm border-b border-border/50 flex items-center px-4 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                        className="h-10 w-10 -ml-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <div className="ml-2">
                        <LogoCompact />
                    </div>
                    <div className="ml-auto">
                        <Link href="/profile">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md hover:shadow-lg transition-shadow">
                                {state.userProfile?.avatarInitials || <User className="h-5 w-5" />}
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

            {/* Booking Method Selector */}
            {wizardState?.mode === 'selector' && (
                <BookingMethodSelector
                    serviceName={wizardState.service.title}
                    serviceType={wizardState.serviceType}
                    onSelectChat={async () => {
                        // User chose chat flow
                        const service = wizardState.service;
                        setWizardState(null);

                        // Continue with traditional chat flow
                        addMessage(`Selected: ${service.title}`, "user");
                        setLoading(true);

                        try {
                            const agentResponse = await handleOptionSelection(service, state.currentBooking);
                            addMessage(agentResponse.content, "assistant", {
                                options: agentResponse.options,
                                quickReplies: agentResponse.quickReplies,
                            });
                        } catch (error) {
                            addMessage("Sorry, something went wrong. Please try again.", "assistant");
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onSelectWizard={() => {
                        // User chose wizard
                        setWizardState({ ...wizardState, mode: 'wizard' });
                    }}
                    onCancel={() => {
                        setWizardState(null);
                    }}
                />
            )}

            {/* Booking Wizard Modal */}
            {wizardState?.mode === 'wizard' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
                    <div className="w-full max-w-4xl my-auto relative animate-pop-in">
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to cancel this booking?')) {
                                    setWizardState(null);
                                }
                            }}
                            className="absolute -top-4 -right-4 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl hover:shadow-red-500/50 transition-all hover:scale-110 flex items-center justify-center group"
                        >
                            <X className="h-6 w-6 group-hover:rotate-90 transition-transform" />
                        </button>

                        <BookingWizard
                            serviceType={wizardState.serviceType}
                            selectedService={wizardState.service}
                            sessionId={sessionId}
                            userProfile={state.userProfile}
                            onComplete={async (bookingId) => {
                                console.log('[Chat] ✅ Booking complete:', bookingId);
                                setWizardState(null);

                                // Fetch booking details to show in receipt
                                try {
                                    const response = await fetch('/api/bookings');
                                    const bookings = await response.json();
                                    const booking = bookings.find((b: any) => b.id === bookingId);

                                    if (booking) {
                                        // Add to booking context
                                        const newRecord: BookingRecord = {
                                            id: booking.id,
                                            serviceId: booking.serviceId || booking.id,
                                            type: booking.type,
                                            title: booking.title,
                                            subtitle: booking.subtitle || '',
                                            date: new Date(booking.date),
                                            status: booking.status,
                                            amount: booking.amount,
                                            details: booking.details || {}
                                        };

                                        await addBooking(newRecord);

                                        // Create receipt data
                                        const receiptData = {
                                            id: booking.id,
                                            serviceName: booking.title,
                                            location: booking.subtitle,
                                            date: new Date(booking.date).toLocaleDateString(),
                                            time: booking.details?.time || 'N/A',
                                            seats: booking.details?.seats?.join(', ') || 'N/A',
                                            passengers: booking.details?.passengerCount || 1,
                                            price: booking.amount,
                                            status: booking.status as "Confirmed" | "Pending" | "Under Review",
                                            userName: state.userProfile?.name || "Guest",
                                            userPhone: state.userProfile?.phone || "N/A",
                                            timestamp: new Date().toISOString(),
                                            paymentMethod: booking.details?.paymentMethod as 'qr' | 'cash' | undefined,
                                            qrCodeUrl: booking.details?.paymentMethod === 'qr' ? undefined : undefined // TODO: Add actual QR code URL
                                        };

                                        // Natural, conversational confirmation
                                        const userName = state.userProfile?.name || '';
                                        const greetingName = userName ? ` ${userName}` : '';
                                        let confirmationMessage = '';

                                        // Check if any changes were made (future: reschedule logic)
                                        const wasRescheduled = false; // TODO: Implement actual rescheduling detection

                                        if (booking.status === 'Under Review') {
                                            // Get passenger names if available
                                            const passengerNames = booking.details?.passengers?.map((p: any) => p.fullName).filter(Boolean) || [];
                                            const passengerList = passengerNames.length > 0 ? '\n👥 **Passengers:**\n' + passengerNames.map((n: string, i: number) => `   ${i + 1}. ${n}`).join('\n') : '';

                                            confirmationMessage = `✅ **Perfect! Your booking is reserved${greetingName}!**\n\nI've successfully booked **${booking.title}** for you!\n\n📋 **Complete Booking Details:**\n━━━━━━━━━━━━━━━━━━━━\n🆔 Booking ID: **${booking.id}**\n📍 Location: ${booking.subtitle}\n📅 Date: ${receiptData.date}\n🕐 Time: ${receiptData.time}${receiptData.seats !== 'N/A' ? `\n💺 Seats: **${receiptData.seats}**` : ''}${receiptData.passengers > 1 ? `\n👥 Total Passengers: ${receiptData.passengers}` : ''}${passengerList}\n💰 Total Amount: **${booking.amount}**\n━━━━━━━━━━━━━━━━━━━━\n\n**Next Steps:**\n1️⃣ Scan the QR code above to complete payment\n2️⃣ Our team will verify (2-5 minutes)\n3️⃣ You'll get confirmation here\n\n⏰ **Important:** Please arrive ${wizardState?.serviceType === 'movie' ? '15 minutes' : wizardState?.serviceType === 'bus' || wizardState?.serviceType === 'flight' ? '30 minutes' : '10 minutes'} before your scheduled time.\n\n💾 Save your booking ID: **${booking.id}**`;
                                        } else if (booking.status === 'Confirmed') {
                                            // Get passenger names if available
                                            const passengerNames = booking.details?.passengers?.map((p: any) => p.fullName).filter(Boolean) || [];
                                            const passengerList = passengerNames.length > 0 ? '\n👥 **Passengers:**\n' + passengerNames.map((n: string, i: number) => `   ${i + 1}. ${n}`).join('\n') : '';

                                            const encouragement = wizardState?.serviceType === 'appointment'
                                                ? 'The specialist is ready to see you!'
                                                : wizardState?.serviceType === 'movie'
                                                ? 'Enjoy the show! 🍿'
                                                : wizardState?.serviceType === 'bus' || wizardState?.serviceType === 'flight'
                                                ? 'Have a safe journey! ✈️'
                                                : 'Looking forward to seeing you there!';

                                            confirmationMessage = `🎉 **All done${greetingName}! You're confirmed!**\n\n${wasRescheduled ? '⚠️ Quick note: I had to adjust your time slightly due to high demand, but everything else is perfect!\n\n' : ''}Your booking for **${booking.title}** is now **CONFIRMED**!\n\n📋 **Complete Booking Details:**\n━━━━━━━━━━━━━━━━━━━━\n🆔 Booking ID: **${booking.id}**\n📍 Location: ${booking.subtitle}\n📅 Date: ${receiptData.date}\n🕐 Time: ${receiptData.time}${receiptData.seats !== 'N/A' ? `\n💺 Seats: **${receiptData.seats}**` : ''}${receiptData.passengers > 1 ? `\n👥 Total Passengers: ${receiptData.passengers}` : ''}${passengerList}\n💰 Total: **${booking.amount}**\n${booking.details?.paymentMethod === 'cash' ? '💵 Payment: **On Arrival**' : '💳 Payment: **Received ✓**'}\n━━━━━━━━━━━━━━━━━━━━\n\n${encouragement}\n\n⏰ **Please arrive ${wizardState?.serviceType === 'movie' ? '15 minutes' : wizardState?.serviceType === 'bus' || wizardState?.serviceType === 'flight' ? '30 minutes' : '10 minutes'} early.**\n\nSee you there! 🎊`;
                                        }

                                        // Add reschedule notice if needed (future enhancement)
                                        const hasConflict = false; // TODO: Check for actual conflicts
                                        if (hasConflict) {
                                            confirmationMessage += `\n\n⚠️ **Note:** I had to adjust your time slot due to high demand. Your new time is ${receiptData.time}. Hope this works for you!`;
                                        }

                                        addMessage(confirmationMessage, "assistant", { receipt: receiptData });
                                    } else {
                                        // Fallback if booking not found
                                        addMessage(
                                            `🎉 Booking confirmed! ID: **${bookingId}**`,
                                            "assistant"
                                        );
                                    }
                                } catch (error) {
                                    console.error('[Chat] Failed to fetch booking details:', error);
                                    addMessage(
                                        `🎉 Booking confirmed! ID: **${bookingId}**`,
                                        "assistant"
                                    );
                                }
                            }}
                            onCancel={() => {
                                console.log('[Chat] ❌ Wizard cancelled');
                                setWizardState(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}