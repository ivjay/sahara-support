"use client";

import { useEffect, useCallback, useState } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sidebar } from "@/components/chat/Sidebar";
import { processMessage, handleOptionSelection } from "@/lib/chat/agent";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Menu, HeartHandshake } from "lucide-react";

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const {
        state,
        addMessage,
        setLoading,
        setBooking,
    } = useChatContext();

    // Handle sending message
    const handleSend = useCallback(async (text: string) => {
        addMessage(text, "user");
        setLoading(true);

        try {
            const response = await processMessage(text, state.currentBooking);

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
    }, [state.currentBooking, addMessage, setLoading, setBooking]);

    // Handle option selection
    const handleOptionSelect = useCallback(async (option: BookingOption) => {
        addMessage(`I'll take "${option.title}"`, "user");
        setLoading(true);

        try {
            const response = await handleOptionSelection(option);
            addMessage(response.content, "assistant", {
                quickReplies: response.quickReplies,
            });
        } catch (error) {
            addMessage("Sorry, couldn't process your selection.", "assistant");
        } finally {
            setLoading(false);
        }
    }, [addMessage, setLoading]);

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
        </div>
    );
}
