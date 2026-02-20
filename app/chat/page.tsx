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
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationPermission } from "@/components/notifications/NotificationPermission";
import { useNotifications } from "@/lib/notifications/notification-context";
import { createBookingNotificationsAndReminders } from "@/lib/notifications/booking-notifications";
import { generateReceiptFromBooking, generateDetailedReceipt } from "@/lib/booking/receipt-generator";
import { getServicePassengerLabel, getServiceCheckInTime } from "@/lib/booking/service-helpers";

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string>("");
    const [pendingVerifications, setPendingVerifications] = useState<Set<string>>(new Set());
    const conversationHistoryRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);

    const {
        state,
        addMessage,
        setLoading,
        setWizardState, // Added
    } = useChatContext();

    // Ref to track generation and allow cancellation
    const isGeneratingRef = useRef(false);

    // Booking Wizard state from context
    const wizardState = state.wizardState;
    const [sessionId] = useState(() => generateSessionId());

    const { addBooking } = useBookings();
    const { createNotification } = useNotifications();

    const handleStop = useCallback(() => {
        console.log("[Chat] 🛑 Stopping generation...");
        isGeneratingRef.current = false;
        setLoading(false);
    }, [setLoading]);

    const handleSend = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage(text, "user");
        setLoading(true);
        isGeneratingRef.current = true;

        try {
            console.log("[Chat] Sending message:", text);

            const response = await newSendMessage(
                text,
                conversationHistoryRef.current,
                conversationId,
                state.userProfile?.name,
                state.userProfile?.id // ✅ Pass user ID for isolation
            );

            if (!isGeneratingRef.current) {
                console.log("[Chat] ⚡ Response ignored (stopped by user)");
                return;
            }

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
                seatSelection: response.seatSelection
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

                // Create notification and schedule reminders
                if (state.userProfile?.id) {
                    await createBookingNotificationsAndReminders(
                        {
                            id: state.userProfile.id,
                            name: state.userProfile.name,
                            phone: state.userProfile.phone
                        },
                        {
                            bookingId: newRecord.id,
                            serviceType: newRecord.type,
                            destination: newRecord.subtitle,
                            date: newRecord.date,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    );
                }

                if (newRecord.status === "Under Review") {
                    setPendingVerifications(prev => new Set(prev).add(bookingId));
                    return; // Skip celebration message for now
                }

                // Generate receipt using utility
                const receiptData = generateReceiptFromBooking(
                    newRecord,
                    {
                        name: state.userProfile?.name,
                        phone: state.userProfile?.phone
                    }
                );

                addMessage(
                    `🎉 Booking confirmed! ID: **${bookingId}**`,
                    "assistant",
                    { receipt: receiptData }
                );
            }

        } catch (error) {
            console.error("[Chat] Error:", error);

            const errorMessage = error instanceof Error && error.message === 'Request timeout'
                ? "Sorry, the request took too long. Please try again."
                : "Sorry, something went wrong. Please try again.";

            addMessage(errorMessage, "assistant");
        } finally {
            setLoading(false);
            isGeneratingRef.current = false;
        }
    }, [conversationId, addMessage, setLoading, addBooking, state.userProfile]);

    const onStepDataChange = useCallback((data: Record<string, unknown>) => {
        setWizardState(prev => prev ? {
            ...prev,
            stepData: {
                ...prev.stepData,
                ...data
            }
        } : null);
    }, [setWizardState]);

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

        addMessage(`Selected: ${option.title}`, "user");
        setLoading(true);
        isGeneratingRef.current = true;

        try {
            // Call the agent's option handler
            const agentResponse = await handleOptionSelection(option, state.currentBooking);

            // ✅ CHECK: If user stopped generation, ignore result
            if (!isGeneratingRef.current) {
                console.log("[Chat] ⚡ Option response ignored (stopped by user)");
                return;
            }

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
            if (isGeneratingRef.current) {
                addMessage("Sorry, something went wrong. Please try again.", "assistant");
            }
        } finally {
            setLoading(false);
            isGeneratingRef.current = false;
        }
    }, [addMessage, setLoading, state.currentBooking]);

    // ✅ SMART POLLING: Exponential backoff polling for admin verification
    const { bookings, refreshBookings } = useBookings();
    useEffect(() => {
        // Only poll if there are pending verifications
        if (pendingVerifications.size === 0) return;

        console.log(`[Chat] 👀 Watching ${pendingVerifications.size} pending verification(s)...`);

        let pollDelay = 5000; // Start at 5 seconds
        const maxDelay = 60000; // Max 60 seconds
        const maxDuration = 600000; // Stop after 10 minutes
        const startTime = Date.now();
        let timeoutId: NodeJS.Timeout;

        const poll = async () => {
            // Check if we've exceeded max duration
            if (Date.now() - startTime > maxDuration) {
                console.log('[Chat] ⏱️ Polling timeout reached (10 minutes)');
                return;
            }

            console.log(`[Chat] 🔄 Checking for admin verification (next check in ${pollDelay / 1000}s)...`);
            await refreshBookings();

            // Exponential backoff: double the delay up to max
            pollDelay = Math.min(pollDelay * 2, maxDelay);

            // Schedule next poll
            timeoutId = setTimeout(poll, pollDelay);
        };

        // Start polling
        timeoutId = setTimeout(poll, pollDelay);

        return () => {
            console.log('[Chat] 🛑 Stopped polling');
            clearTimeout(timeoutId);
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

                // Generate receipt using utility
                const receiptData = generateReceiptFromBooking(
                    booking,
                    {
                        name: state.userProfile?.name,
                        phone: state.userProfile?.phone
                    }
                );

                addMessage(
                    `✅ **Admin Verified!** Your payment for **${booking.title}** has been confirmed.`,
                    "assistant",
                    { receipt: receiptData }
                );
            }
        });
    }, [bookings, pendingVerifications, addMessage, state.userProfile]);

    const handleNewChat = useCallback(() => {
        setConversationId("");
        conversationHistoryRef.current = [];
        setSidebarOpen(false);
        // ✅ CRITICAL: Reset loading and generation states
        setLoading(false);
        isGeneratingRef.current = false;
    }, [setLoading]);

    const handleCloseSidebar = useCallback(() => setSidebarOpen(false), []);

    return (
        <div className="h-dvh flex overflow-hidden bg-background">
            <div className="hidden lg:block w-[260px] shrink-0 border-r border-border">
                <Sidebar
                    isOpen={true}
                    onClose={handleCloseSidebar}
                    onNewChat={handleNewChat}
                />
            </div>

            <div className="lg:hidden">
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={handleCloseSidebar}
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
                    <div className="ml-auto flex items-center gap-2">
                        <NotificationBell />
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
                    onStop={handleStop}
                    isGenerating={state.isLoading}
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
                        isGeneratingRef.current = true;

                        try {
                            const agentResponse = await handleOptionSelection(service, state.currentBooking);

                            if (!isGeneratingRef.current) return;

                            addMessage(agentResponse.content, "assistant", {
                                options: agentResponse.options,
                                quickReplies: agentResponse.quickReplies,
                                seatSelection: agentResponse.seatSelection
                            });
                        } catch (error) {
                            if (isGeneratingRef.current) {
                                addMessage("Sorry, something went wrong. Please try again.", "assistant");
                            }
                        } finally {
                            setLoading(false);
                            isGeneratingRef.current = false;
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
                                setWizardState(null);
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
                            stepData={wizardState.stepData}
                            onStepDataChange={onStepDataChange}
                            onComplete={async (bookingId) => {
                                console.log('[Chat] ✅ Booking complete:', bookingId);
                                setWizardState(null);

                                // Fetch booking details to show in receipt
                                try {
                                    const response = await fetch('/api/bookings');
                                    const bookings = await response.json();
                                    const booking = bookings.find((b: BookingRecord) => b.id === bookingId);

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

                                        // Create notification and schedule reminders using utility
                                        if (state.userProfile?.id) {
                                            await createBookingNotificationsAndReminders(
                                                {
                                                    id: state.userProfile.id,
                                                    name: state.userProfile.name,
                                                    phone: state.userProfile.phone
                                                },
                                                {
                                                    bookingId: booking.id,
                                                    serviceType: booking.type,
                                                    destination: booking.subtitle || booking.details?.to,
                                                    date: new Date(booking.date),
                                                    time: booking.details?.time || 'N/A'
                                                }
                                            );
                                        }

                                        // Generate detailed receipt using utility
                                        const receiptData = generateDetailedReceipt(
                                            {
                                                id: booking.id,
                                                title: booking.title,
                                                subtitle: booking.subtitle,
                                                date: new Date(booking.date),
                                                amount: booking.amount,
                                                type: booking.type,
                                                status: booking.status,
                                                details: booking.details
                                            },
                                            {
                                                name: state.userProfile?.name,
                                                phone: state.userProfile?.phone
                                            }
                                        );

                                        // Natural, conversational confirmation
                                        const userName = state.userProfile?.name || '';
                                        const greetingName = userName ? ` ${userName}` : '';
                                        let confirmationMessage = '';

                                        // Check if any changes were made (future: reschedule logic)
                                        const wasRescheduled = false; // TODO: Implement actual rescheduling detection

                                        // Helper: get smart location label
                                        const locationLabel = booking.subtitle ||
                                            booking.details?.hospital ||
                                            booking.details?.clinic ||
                                            booking.details?.theater ||
                                            booking.details?.to ||
                                            'See booking details';

                                        // Helper: context-aware people label (using service helpers)
                                        const isAppointment = wizardState?.serviceType === 'appointment';
                                        const peopleLabel = getServicePassengerLabel(wizardState?.serviceType, true);

                                        // Helper: passenger/patient names
                                        const passengerNames = booking.details?.passengers?.map((p: { fullName?: string }) => p.fullName).filter(Boolean) || [];
                                        const peopleListLabel = getServicePassengerLabel(wizardState?.serviceType, false);
                                        const passengerList = passengerNames.length > 0
                                            ? `\n👤 **${peopleListLabel}:**\n` + passengerNames.map((n: string, i: number) => `   ${i + 1}. ${n}`).join('\n')
                                            : '';

                                        const checkInMinutes = getServiceCheckInTime(wizardState?.serviceType);
                                        const arriveEarly = `${checkInMinutes} minutes`;

                                        if (booking.status === 'Under Review') {
                                            confirmationMessage = `✅ **Perfect! Your booking is reserved${greetingName}!**\n\nI've successfully booked **${booking.title}** for you!\n\n📋 **Complete Booking Details:**\n━━━━━━━━━━━━━━━━━━━━\n🆔 Booking ID: **${booking.id}**\n📍 ${isAppointment ? 'Clinic' : 'Location'}: ${locationLabel}\n📅 Date: ${receiptData.date}\n🕐 Time: ${receiptData.time}${receiptData.seats && receiptData.seats !== 'N/A' ? `\n💺 Seats: **${receiptData.seats}**` : ''}${receiptData.passengers && receiptData.passengers > 1 ? `\n👥 ${peopleLabel}: ${receiptData.passengers}` : ''}${passengerList}\n💰 Total Amount: **${booking.amount}**\n━━━━━━━━━━━━━━━━━━━━\n\n**Next Steps:**\n1️⃣ Scan the QR code above to complete payment\n2️⃣ Our team will verify (2-5 minutes)\n3️⃣ You'll get confirmation here\n\n⏰ **Important:** Please arrive **${arriveEarly} early**.\n\n💾 Save your booking ID: **${booking.id}**`;
                                        } else if (booking.status === 'Confirmed') {
                                            const encouragement = isAppointment
                                                ? 'The specialist is ready to see you!'
                                                : wizardState?.serviceType === 'movie'
                                                    ? 'Enjoy the show! 🍿'
                                                    : wizardState?.serviceType === 'bus' || wizardState?.serviceType === 'flight'
                                                        ? 'Have a safe journey! ✈️'
                                                        : 'Looking forward to seeing you there!';

                                            confirmationMessage = `🎉 **All done${greetingName}! You're confirmed!**\n\n${wasRescheduled ? '⚠️ Quick note: I had to adjust your time slightly due to high demand, but everything else is perfect!\n\n' : ''}Your booking for **${booking.title}** is now **CONFIRMED**!\n\n📋 **Complete Booking Details:**\n━━━━━━━━━━━━━━━━━━━━\n🆔 Booking ID: **${booking.id}**\n📍 ${isAppointment ? 'Clinic' : 'Location'}: ${locationLabel}\n📅 Date: ${receiptData.date}\n🕐 Time: ${receiptData.time}${receiptData.seats && receiptData.seats !== 'N/A' ? `\n💺 Seats: **${receiptData.seats}**` : ''}${receiptData.passengers && receiptData.passengers > 1 ? `\n👥 ${peopleLabel}: ${receiptData.passengers}` : ''}${passengerList}\n💰 Total: **${booking.amount}**\n${booking.details?.paymentMethod === 'cash' ? '💵 Payment: **On Arrival**' : '💳 Payment: **Received ✓**'}\n━━━━━━━━━━━━━━━━━━━━\n\n${encouragement}\n\n⏰ **Please arrive ${arriveEarly} early.**\n\nSee you there! 🎊`;
                                        }

                                        // Add reschedule notice if needed (future enhancement)
                                        const hasConflict = false; // TODO: Check for actual conflicts
                                        if (hasConflict) {
                                            confirmationMessage += `\n\n⚠️ **Note:** I had to adjust your time slot due to high demand. Your new time is ${receiptData.time}. Hope this works for you!`;
                                        }

                                        const postBookingReplies = isAppointment
                                            ? ["View my appointments", "Reschedule", "Book another"]
                                            : ["View my bookings", "Book another"];

                                        addMessage(confirmationMessage, "assistant", {
                                            receipt: receiptData,
                                            quickReplies: postBookingReplies
                                        });
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

            {/* Notification Permission Prompt */}
            <NotificationPermission />
        </div>
    );
}