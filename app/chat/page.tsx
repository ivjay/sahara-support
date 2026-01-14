"use client";

import { useEffect, useCallback } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { processMessage, getWelcomeMessage, handleOptionSelection } from "@/lib/chat/agent";
import { BookingOption } from "@/lib/chat/types";

export default function ChatPage() {
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

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Chat Messages */}
            <ChatContainer onOptionSelect={handleOptionSelect} />

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
    );
}
