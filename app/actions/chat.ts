"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry, formatApiError } from "@/lib/chat/chat-service";
import { getUserContextForAI, CURRENT_USER } from "@/lib/user-context";
import { generateContentWithGitHub } from "@/lib/chat/github-service";
import { SAHARA_SYSTEM_PROMPT, detectLanguage, parseBookingResponse } from "@/lib/chat/system-prompt-v2";
import { chat as ollamaChat } from "@/lib/integrations/ollama-service";
import {
    saveConversation,
    createBooking,
    generateConversationId,
    type ConversationStage,
    type BookingType
} from "@/lib/supabase";

// Initialize Gemini (fallback)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AgentResponseAPIType {
    content: string;
    stage?: string;
    language?: string;
    booking_type?: string | null;
    collected_details?: Record<string, any>;
    ready_to_book?: boolean;
    booking?: any;
    // Legacy fields for backwards compatibility
    showOptions?: "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null;
    filterCategory?: string | null;
    quickReplies?: string[];
}

export async function getAgentResponse(
    message: string,
    history: { role: "user" | "model"; parts: string }[] = [],
    conversationId?: string
): Promise<AgentResponseAPIType> {

    // Generate conversation ID if not provided
    const convId = conversationId || generateConversationId();

    // Detect user's language
    const userLanguage = detectLanguage(message);

    // 1. Try Ollama (Primary - New System Prompt v2.0)
    if (process.env.OLLAMA_BASE_URL) {
        try {
            console.log("[Chat] 🦙 Using Ollama with System Prompt v2.0...");

            // Convert history to Ollama format
            const ollamaMessages = [
                { role: 'system' as const, content: SAHARA_SYSTEM_PROMPT },
                ...history.map(h => ({
                    role: (h.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant',
                    content: h.parts
                })),
                { role: 'user' as const, content: message }
            ];

            const response = await ollamaChat(ollamaMessages, { temperature: 0.7 });

            // Parse response using helper function
            const parsed = parseBookingResponse(response.message.content);

            // Save conversation to Supabase
            if (parsed.stage) {
                const conversationMessages = [
                    ...history.map(h => ({
                        role: h.role === 'model' ? 'assistant' as const : 'user' as const,
                        content: h.parts,
                        timestamp: new Date().toISOString()
                    })),
                    {
                        role: 'user' as const,
                        content: message,
                        timestamp: new Date().toISOString()
                    },
                    {
                        role: 'assistant' as const,
                        content: parsed.message,
                        timestamp: new Date().toISOString()
                    }
                ];

                await saveConversation(
                    convId,
                    conversationMessages,
                    parsed.stage as ConversationStage,
                    parsed.language as 'en' | 'ne' || userLanguage,
                    undefined, // userId - can be added later
                    parsed.collected_details
                );
            }

            // Create booking if ready
            if (parsed.ready_to_book && parsed.booking) {
                const bookingResult = await createBooking(
                    parsed.booking_type as BookingType,
                    parsed.booking,
                    undefined, // userId
                    parsed.booking.total_price
                );

                if (bookingResult.success) {
                    console.log("[Chat] ✓ Created booking:", bookingResult.bookingId);
                    // Update message with booking ID
                    parsed.message += `\n\n📋 Your booking ID is: **${bookingResult.bookingId}**`;
                }
            }

            return {
                content: parsed.message,
                stage: parsed.stage,
                language: parsed.language,
                booking_type: parsed.booking_type,
                collected_details: parsed.collected_details,
                ready_to_book: parsed.ready_to_book,
                booking: parsed.booking,
                // Map to legacy format for UI compatibility
                showOptions: mapStageToShowOptions(parsed.stage, parsed.booking_type),
                filterCategory: null,
                quickReplies: []
            };

        } catch (error: any) {
            console.warn("[Chat] Ollama Error:", error.message);
            console.log("[Chat] ⚠️ Falling back to Gemini...");
        }
    }

    // 2. Try GitHub Models (Secondary)
    if (process.env.GITHUB_TOKEN) {
        try {
            const ghMessages = history.map(h => ({
                role: h.role === "model" ? "assistant" : "user",
                content: h.parts
            }));
            ghMessages.push({ role: "user", content: message });

            const response = await withRetry(async () => {
                return await generateContentWithGitHub(SAHARA_SYSTEM_PROMPT, ghMessages);
            });

            const parsed = parseBookingResponse(response);
            return {
                content: parsed.message,
                stage: parsed.stage,
                language: parsed.language,
                showOptions: mapStageToShowOptions(parsed.stage, parsed.booking_type),
                filterCategory: null,
                quickReplies: []
            };
        } catch (error: any) {
            console.warn("[Chat] GitHub Models Error:", error.message);
        }
    }

    // 3. Gemini Fallback (Tertiary)
    try {
        const response = await withRetry(async () => {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: { responseMimeType: "application/json" }
            });

            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: SAHARA_SYSTEM_PROMPT }]
                    },
                    {
                        role: "model",
                        parts: [{ text: '{"message":"Understood. I am Sahara, ready to assist!","stage":"greeting","language":"en","booking_type":null,"ready_to_book":false}' }]
                    },
                    ...history.map(h => ({
                        role: h.role,
                        parts: [{ text: h.parts }]
                    }))
                ],
            });

            const result = await chat.sendMessage(message);
            return result.response.text();
        });

        const parsed = parseBookingResponse(response);
        return {
            content: parsed.message,
            stage: parsed.stage,
            language: parsed.language,
            showOptions: mapStageToShowOptions(parsed.stage, parsed.booking_type),
            filterCategory: null,
            quickReplies: []
        };

    } catch (error) {
        console.error("[Chat] All AI Services Failed:", error);
        return {
            content: formatApiError(error),
            stage: 'greeting',
            language: 'en',
            showOptions: null,
            filterCategory: null,
            quickReplies: ["Try again"]
        };
    }
}

/**
 * Map conversation stage to legacy showOptions format for UI compatibility
 */
function mapStageToShowOptions(
    stage?: string,
    bookingType?: string | null
): "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null {
    if (stage === 'confirming' && bookingType) {
        switch (bookingType) {
            case 'bus': return 'BUS_BOOKING';
            case 'flight': return 'FLIGHT_BOOKING';
            case 'doctor':
            case 'salon': return 'APPOINTMENT';
            case 'movie': return 'MOVIE_BOOKING';
        }
    }
    return null;
}

/**
 * Simplified interface for chat page - wraps getAgentResponse
 */
export interface SendMessageResponse {
    success: boolean;
    message: string;
    conversationId?: string;
    bookingType?: string;
    booking?: {
        success: boolean;
        bookingId?: string;
        details?: Record<string, any>;
    };
    error?: string;
}

export async function sendMessage(
    userMessage: string,
    conversationId?: string
): Promise<SendMessageResponse> {
    try {
        // Generate or use existing conversation ID
        const convId = conversationId || generateConversationId();

        // Get AI response with full conversation tracking
        const response = await getAgentResponse(userMessage, [], convId);

        // Prepare the response
        const result: SendMessageResponse = {
            success: true,
            message: response.content,
            conversationId: convId,
            bookingType: response.booking_type || undefined,
        };

        // If booking is ready, include booking details
        if (response.ready_to_book && response.booking) {
            result.booking = {
                success: true,
                bookingId: `BK${Date.now()}`, // Generate simple booking ID
                details: response.collected_details || response.booking
            };
        }

        return result;

    } catch (error: any) {
        console.error("[sendMessage] Error:", error);
        return {
            success: false,
            message: "Sorry, something went wrong. Please try again.",
            error: error.message || "Unknown error"
        };
    }
}
