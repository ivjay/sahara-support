"use server";

import { processMessage } from "@/lib/chat/agent";
import {
    saveConversation,
    createBooking,
    getConversation
} from "@/lib/supabase";
import { BookingOption } from "@/lib/chat/types";
import { getAllServices } from "@/lib/services/service-api";

export interface AgentResponseAPIType {
    success: boolean;
    content: string;
    conversationId: string;
    bookingType?: string;
    quickReplies?: string[];
    options?: BookingOption[];
    booking?: {
        success: boolean;
        bookingId?: string;
        details?: Record<string, any>;
    };
}

/**
 * Main entry point for chat interactions
 */
export async function sendMessage(
    userMessage: string,
    conversationId: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AgentResponseAPIType> {
    try {
        console.log(`[Chat] Processing message: "${userMessage}"`);

        // Get all available services (mocks + admin-created)
        const allServices = await getAllServices();
        console.log(`[Chat] Loaded ${allServices.length} total services`);

        // Process message through agent
        const agentResponse = await processMessage(
            userMessage,
            null, // Current booking state (not used yet)
            allServices
        );

        console.log("[Chat] Agent returned:", {
            contentLength: agentResponse.content.length,
            hasOptions: !!agentResponse.options,
            optionsCount: agentResponse.options?.length || 0,
            quickRepliesCount: agentResponse.quickReplies?.length || 0
        });

        // Generate conversation ID if new
        const finalConversationId = conversationId || `CONV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Save conversation to Supabase (fail silently if not configured)
        try {
            await saveConversation({
                conversation_id: finalConversationId,
                messages: [
                    ...conversationHistory,
                    { role: "user", content: userMessage },
                    { role: "assistant", content: agentResponse.content }
                ],
                stage: "gathering",
                language: "en",
                collected_details: {}
            });
            console.log("[Chat] ✓ Saved to Supabase");
        } catch (dbError: any) {
            console.warn("[Chat] Supabase save failed (non-critical):", dbError.message);
        }

        // Create booking in DB if completed
        let bookingResult = undefined;
        if (agentResponse.newBookingState?.isComplete) {
            try {
                const details = agentResponse.newBookingState.collectedData;
                const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;

                await createBooking({
                    booking_id: bookingId,
                    booking_type: agentResponse.newBookingState.intent.replace('_BOOKING', '').toLowerCase(),
                    details: details,
                    total_price: parseFloat(details.price?.replace(/[^\d.]/g, '') || '0'),
                    status: details.cash ? 'confirmed' : 'pending' // Cash is auto-confirmed
                });

                bookingResult = {
                    success: true,
                    bookingId: bookingId,
                    details: details
                };
                console.log(`[Chat] ✓ Booking created in Supabase: ${bookingId}`);
            } catch (createError) {
                console.error("[Chat] Failed to create booking record:", createError);
            }
        }

        // Return response with ALL fields
        return {
            success: true,
            content: agentResponse.content,
            conversationId: finalConversationId,
            bookingType: agentResponse.newBookingState?.intent.toLowerCase().replace('_booking', ''),
            quickReplies: agentResponse.quickReplies || [],
            options: agentResponse.options || [],
            booking: bookingResult
        };

    } catch (error: any) {
        console.error("[Chat] Error in sendMessage:", error);
        return {
            success: false,
            content: "Sorry, something went wrong. Please try again.",
            conversationId: conversationId || "",
            quickReplies: [],
            options: []
        };
    }
}

/**
 * LEGACY: Used by lib/chat/agent.ts for AI responses
 */
export async function getAgentResponse(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
) {
    // Simple passthrough - real logic is in processMessage
    return {
        content: "I can help you book services. What would you like?",
        stage: "gathering",
        language: "en",
        booking_type: null,
        collected_details: {},
        showOptions: null,
        filterCategory: null,
        quickReplies: []
    };
}