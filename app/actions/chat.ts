"use server";

import { processMessage } from "@/lib/chat/agent";
import { saveConversation, createBooking } from "@/lib/supabase";
import { BookingOption } from "@/lib/chat/types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS
} from "@/lib/chat/mock-data";
import { chat as ollamaChat } from "@/lib/integrations/ollama-service";
import { SAHARA_SYSTEM_PROMPT, parseBookingResponse } from "@/lib/chat/sahara-prompt-conversational";

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
 * Fetch admin-created services from Supabase (with timeout)
 */
async function getAdminServices(): Promise<BookingOption[]> {
    try {
        const { supabase } = await import("@/lib/supabase");

        // Add a race condition with timeout to fail fast
        const fetchPromise = supabase
            .from('services')
            .select('*')
            .eq('available', true);

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Supabase timeout')), 2000)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (error) {
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        // ✅ Convert to BookingOption format
        return data.map((service: any) => ({
            id: service.id,
            type: service.type || 'appointment',
            category: service.category,
            title: service.title,
            subtitle: service.subtitle || '',
            price: service.price || 0,
            currency: service.currency || 'NPR',
            details: service.details || {},
            available: service.available !== false,
            qrCodeUrl: service.qrCodeUrl
        })) as BookingOption[];
    } catch (error) {
        // Silently fail - just use mock data
        return [];
    }
}

async function getRelevantServices(userMessage: string, history: Array<{ role: string; content: string }> = []): Promise<BookingOption[]> {
    const context = history.slice(-3).map(m => m.content).join(' ').toLowerCase();
    const msg = userMessage.toLowerCase() + " " + context;

    let mockServices: BookingOption[] = [];

    // Get relevant mock services
    if (msg.includes('bus')) mockServices = MOCK_BUS_OPTIONS;
    else if (msg.includes('flight') || msg.includes('fly')) mockServices = MOCK_FLIGHT_OPTIONS;
    else if (msg.includes('doctor') || msg.includes('appointment') || msg.includes('hospital') ||
             msg.includes('therapy') || msg.includes('therapist') || msg.includes('psychologist')) {
        mockServices = MOCK_APPOINTMENT_OPTIONS;
    }
    else if (msg.includes('movie') || msg.includes('cinema')) mockServices = MOCK_MOVIE_OPTIONS;

    // ✅ FIX: Fetch and merge admin services
    const adminServices = await getAdminServices();

    console.log(`[Chat] ✓ Found ${mockServices.length} mock services + ${adminServices.length} admin services`);
    if (adminServices.length > 0) {
        console.log('[Chat] ✓ Admin services:', adminServices.map(s => `${s.title} (${s.type})`).join(', '));
    }

    return [...mockServices, ...adminServices];
}

export async function sendMessage(
    userMessage: string,
    conversationId: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<AgentResponseAPIType> {
    try {
        console.log(`[Chat] Processing: "${userMessage}"`);

        const relevantServices = await getRelevantServices(userMessage, conversationHistory);
        const agentResponse = await processMessage(userMessage, null, relevantServices, conversationHistory);

        const finalConversationId = conversationId || `CONV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

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
        } catch (dbError: any) {
            console.warn("[Chat] DB failed:", dbError.message);
        }

        let bookingResult = undefined;
        if (agentResponse.newBookingState?.isComplete) {
            try {
                const details = agentResponse.newBookingState.collectedData;
                const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;
                const bookingType = agentResponse.newBookingState.intent.replace('_BOOKING', '').toLowerCase();
                const totalPrice = parseFloat(details.price?.replace(/[^\d.]/g, '') || '0');

                // Determine status based on verification flag
                const bookingStatus = details.verificationPending === "true"
                    ? 'Under Review'  // Waiting for admin verification
                    : (details.cash ? 'Confirmed' : 'Pending');

                console.log(`[Chat] Creating booking ${bookingId} with status: ${bookingStatus}`);

                // ✅ FIX: Save to file-based DB (what admin/verify reads from)
                const bookingPayload = {
                    id: bookingId,
                    serviceId: details.serviceId || bookingId,
                    title: details.specialist || details.movie_name || details.from || 'Service',
                    subtitle: details.hospital || details.theater || details.to || '',
                    type: bookingType,
                    amount: `NPR ${totalPrice}`,
                    status: bookingStatus,
                    date: details.date || new Date().toISOString(),
                    details: details
                };

                // Save to local file-based DB via API
                const apiResponse = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingPayload)
                });

                if (!apiResponse.ok) {
                    throw new Error('Failed to save booking to database');
                }

                console.log(`[Chat] ✓ Booking saved to file DB: ${bookingId}`);

                // Also save to Supabase for backup
                try {
                    await createBooking({
                        booking_id: bookingId,
                        booking_type: bookingType,
                        details: details,
                        total_price: totalPrice,
                        status: bookingStatus.toLowerCase()
                    });
                    console.log(`[Chat] ✓ Booking also saved to Supabase`);
                } catch (supabaseError) {
                    console.warn('[Chat] Supabase save failed (non-critical):', supabaseError);
                }

                bookingResult = {
                    success: true,
                    bookingId: bookingId,
                    details: details
                };
            } catch (createError) {
                console.error("[Chat] Booking failed:", createError);
            }
        }

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
        console.error("[Chat] Error:", error);
        return {
            success: false,
            content: "Sorry, something went wrong.",
            conversationId: conversationId || "",
            quickReplies: [],
            options: []
        };
    }
}

// Track Ollama health to avoid repeated timeouts
let ollamaHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // Check every 30s

async function checkOllamaHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
        return ollamaHealthy;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch('http://127.0.0.1:11434/api/tags', {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        ollamaHealthy = response.ok;
        lastHealthCheck = now;
        return ollamaHealthy;
    } catch {
        ollamaHealthy = false;
        lastHealthCheck = now;
        return false;
    }
}

export async function getAgentResponse(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
) {
    // Quick health check before attempting Ollama call
    const isHealthy = await checkOllamaHealth();

    if (!isHealthy) {
        console.log("[Chat] ⚠️ Ollama unavailable, using fallback");
        return {
            content: "I can help you with bookings. What service would you like to book?",
            stage: "gathering",
            language: "en",
            booking_type: null,
            collected_details: {},
            showOptions: null as import("@/lib/chat/types").Intent | null,
            optionType: null,
            filterCategory: null as string | null,
            quickReplies: [] as string[]
        };
    }

    try {
        console.log("[Chat] 🦙 Calling Ollama...");

        const messages = [
            { role: "system" as const, content: SAHARA_SYSTEM_PROMPT },
            ...conversationHistory,
            { role: "user" as const, content: userMessage }
        ];

        // ✅ OPTIMIZED: Don't force JSON format for faster responses
        const rawResponse = await ollamaChat(messages as any, {
            temperature: 0.7,
            forceJson: true  // Still need JSON for parsing booking responses
        });
        const parsed = parseBookingResponse(rawResponse.message.content);

        console.log("[Chat] ✓ Stage:", parsed.stage);
        ollamaHealthy = true; // Mark as healthy if successful

        return {
            content: parsed.message,
            stage: parsed.stage,
            language: parsed.language,
            booking_type: parsed.booking_type,
            collected_details: parsed.collected_details || {},
            showOptions: parsed.show_options ?? null as import("@/lib/chat/types").Intent | null,
            optionType: parsed.option_type ?? null,
            filterCategory: parsed.filter_category ?? null as string | null,
            quickReplies: [] as string[]
        };

    } catch (error: any) {
        console.error("[Chat] AI failed:", error.message);
        ollamaHealthy = false; // Mark as unhealthy

        return {
            content: "I can help you with bookings. What service would you like to book?",
            stage: "gathering",
            language: "en",
            booking_type: null,
            collected_details: {},
            showOptions: null as import("@/lib/chat/types").Intent | null,
            optionType: null,
            filterCategory: null as string | null,
            quickReplies: [] as string[]
        };
    }
}