"use client";

import { useEffect, useCallback } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { processMessage, getWelcomeMessage, handleOptionSelection } from "@/lib/chat/agent";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Moon, Sun, PenSquare } from "lucide-react";

export default function ChatPage() {
    const {
        state,
        addMessage,
        setLoading,
        setBooking,
        clearChat,
    } = useChatContext();

    // Add welcome message on mount
    useEffect(() => {
        if (state.messages.length === 0) {
            const welcome = getWelcomeMessage();
            addMessage(welcome.content, "assistant", {
                quickReplies: welcome.quickReplies,
            });
        }
    }, []);

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

    // Handle quick action selection
    const handleQuickAction = useCallback((action: string) => {
        handleSend(action);
    }, [handleSend]);

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

    // Toggle dark mode
    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
    };

    return (
        <TooltipProvider>
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                {/* Header */}
                <header className="h-12 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
                    <div className="flex items-center justify-between px-4 h-full max-w-5xl mx-auto">
                        {/* Left: New chat */}
                        <div className="flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearChat}
                                        className="h-8 gap-2 text-[13px]"
                                    >
                                        <PenSquare className="h-4 w-4" />
                                        <span className="hidden sm:inline">New chat</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Start new conversation</TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Center: Model name */}
                        <p className="text-[13px] font-medium">
                            Sahara
                        </p>

                        {/* Right: Theme toggle */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleDarkMode}
                                    className="h-8 w-8"
                                >
                                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                                    <span className="sr-only">Toggle theme</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Toggle theme</TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                {/* Chat Messages */}
                <ChatContainer onOptionSelect={handleOptionSelect} />

                {/* Quick Actions */}
                {!state.isLoading && !state.currentBooking && state.messages.length === 1 && (
                    <QuickActions onSelect={handleQuickAction} />
                )}

                {/* Input */}
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
        </TooltipProvider>
    );
}
