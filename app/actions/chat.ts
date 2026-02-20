"use server";

import { processMessage } from "@/lib/chat/agent";
import { saveConversation, createBooking } from "@/lib/supabase";
import { BookingOption, UserProfile } from "@/lib/chat/types";
import { chat as ollamaChat } from "@/lib/integrations/ollama-service";
import { getPersonalizedPrompt, parseBookingResponse } from "@/lib/chat/sahara-prompt-conversational";

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
    seatSelection?: {
        venueId: string;
        serviceId: string;
        eventDate: string;
        eventTime: string;
    };
}

async function getRelevantServices(userMessage: string, history: Array<{ role: string; content: string }> = []): Promise<BookingOption[]> {
    try {
        // Use hybrid search for intelligent service retrieval
        const { searchServices } = await import('@/lib/search');

        console.log('[Chat] 🔍 Using hybrid search for:', userMessage);

        const searchResults = await searchServices(userMessage, 20);

        console.log(`[Chat] ✓ Hybrid search found ${searchResults.results.length} services`);

        // Convert search results to BookingOption format
        const services: BookingOption[] = searchResults.results.map(result => ({
            id: result.service_id,
            title: result.title,
            subtitle: result.description,
            price: result.price || 0,
            currency: 'NPR',
            type: result.type as any, // ✅ Use the actual type (movie, bus, etc.)
            category: result.category,
            venueId: result.id,
            images: result.images,
            description: result.description,
            tags: result.tags,
            details: {
                location: result.location || '',
                capacity: result.capacity?.toString() || '',
                rating: result.rating_avg?.toString() || ''
            },
            available: true
        }));

        if (services.length > 0) {
            console.log('[Chat] ✓ Top results:', services.slice(0, 3).map(s =>
                `${s.title} (score: ${searchResults.results.find(r => r.service_id === s.id)?.scores.final.toFixed(2)})`
            ).join(', '));
        }

        return services;
    } catch (error) {
        console.error('[Chat] ✗ Hybrid search failed:', error);
        return [];
    }
}

export async function sendMessage(
    userMessage: string,
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    conversationId?: string,
    userName?: string,
    userId?: string
): Promise<AgentResponseAPIType> {
    try {
        console.log(`[Chat] Processing: "${userMessage}"`);

        // ✅ FAST TRACK: Handle simple greetings without LLM or Search (Solves 45s "Hi" issue)
        const msgValue = userMessage.toLowerCase().trim();
        const greetings = ['hi', 'hello', 'hey', 'namaste', 'morning', 'evening', 'hola'];
        const isSimpleGreeting = greetings.some(g => msgValue === g || msgValue === `${g}.` || msgValue === `${g}!`);

        if (isSimpleGreeting && conversationHistory.length === 0) {
            console.log("[Chat] ⚡ Fast-track greeting detected");
            const finalConversationId = conversationId || `CONV-${Date.now()}`;
            const firstName = userName?.split(' ')[0] || 'there';
            return {
                success: true,
                content: `Namaste ${firstName}! 👋 I'm **Sahara**, your personal assistant. \n\nI can help you book **bus tickets**, **flights**, **doctor appointments**, or **movies** across Nepal. \n\nHow can I help you today?`,
                conversationId: finalConversationId,
                quickReplies: ["Book a bus ticket", "Find flights", "Doctor appointment", "Movie tickets"],
                options: []
            };
        }

        const relevantServices = await getRelevantServices(userMessage, conversationHistory);

        // Construct a search-friendly profile
        const userProfile: UserProfile | undefined = userId ? {
            id: userId,
            name: userName || 'User',
            firstName: userName?.split(' ')[0] || 'User',
            email: '', phone: '', alternatePhone: '', avatarInitials: 'U',
            dateOfBirth: '', gender: '', nationality: '', idNumber: '',
            currentAddress: '', permanentAddress: '', city: 'Kathmandu', postalCode: '',
            emergencyName: '', emergencyPhone: '', emergencyRelation: '',
            kycStatus: 'Not Started', accountType: 'Free', memberSince: '',
            preferences: []
        } : undefined;

        const agentResponse = await processMessage(userMessage, null, relevantServices, conversationHistory, userProfile);

        const currentUserId = userId || 'guest';
        const finalConversationId = conversationId || `CONV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

        try {
            await saveConversation({
                conversation_id: finalConversationId,
                user_id: currentUserId,
                messages: [
                    ...conversationHistory,
                    { role: "user", content: userMessage },
                    { role: "assistant", content: agentResponse.content }
                ],
                stage: agentResponse.stage || "gathering",
                language: "en",
                collected_details: agentResponse.collected_details || {}
            });
        } catch (dbError) {
            console.warn("[Chat] DB failed:", dbError instanceof Error ? dbError.message : String(dbError));
        }

        // Handle Seat Selection metadata for frontend
        let seatSelection = undefined;
        if (agentResponse.stage === 'seating' && agentResponse.collected_details?.serviceId) {
            const serviceId = agentResponse.collected_details.serviceId;
            const service = relevantServices.find(s => s.id === serviceId);
            seatSelection = {
                venueId: (service as any)?.venue_id || (service as any)?.venueId || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                serviceId: serviceId,
                eventDate: agentResponse.collected_details.date || new Date().toISOString().split('T')[0],
                eventTime: agentResponse.collected_details.time || 'all-day'
            };
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
            booking: bookingResult,
            seatSelection: seatSelection
        };

    } catch (error) {
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
    conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
    userProfile?: UserProfile
) {
    // Quick health check before attempting Ollama call
    const isHealthy = await checkOllamaHealth();

    if (!isHealthy) {
        console.log("[Chat] ⚠️ Ollama unavailable, using fallback");
        const msg = userMessage.toLowerCase();
        // Smart fallback: detect intent even without LLM
        const isReschedule = msg.includes('reschedule') || msg.includes('change') && (msg.includes('appointment') || msg.includes('booking'));
        const isViewBookings = msg.includes('my booking') || msg.includes('my appointment') || msg.includes('view my');
        let fallbackContent = "I'm here to help! What would you like to book today?";
        if (isReschedule) fallbackContent = "To reschedule, please share your Booking ID (starts with BK-) and your preferred new date/time.";
        else if (isViewBookings) fallbackContent = "You can view all your bookings and appointments in your **Profile** page. Tap the profile icon at the top right!";
        return {
            content: fallbackContent,
            stage: "gathering",
            language: "en",
            booking_type: null,
            collected_details: {},
            showOptions: null as import("@/lib/chat/types").Intent | null,
            optionType: null,
            filterCategory: null as string | null,
            quickReplies: isViewBookings ? [] : isReschedule ? [] : ["Book a bus", "Find a doctor", "Movie tickets"] as string[]
        };
    }

    try {
        console.log("[Chat] 🦙 Calling Ollama...");

        const messages = [
            { role: "system" as const, content: getPersonalizedPrompt(userProfile) },
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
            content: (parsed as any).message || (parsed as any).content || "I'm here to help! What would you like to do?",
            stage: (parsed as any).stage,
            language: (parsed as any).language,
            booking_type: (parsed as any).booking_type,
            collected_details: (parsed as any).collected_details || {},
            showOptions: (parsed as any).show_options || (parsed as any).showOptions || null,
            optionType: (parsed as any).option_type || (parsed as any).optionType || null,
            filterCategory: (parsed as any).filter_category || (parsed as any).filterCategory || null,
            quickReplies: [] as string[]
        };

    } catch (error) {
        console.error("[Chat] AI failed:", error instanceof Error ? error.message : String(error));
        ollamaHealthy = false; // Mark as unhealthy

        return {
            content: "Sorry, I had a little hiccup there! I'm still here to help — what would you like to do?",
            stage: "gathering",
            language: "en",
            booking_type: null,
            collected_details: {},
            showOptions: null as import("@/lib/chat/types").Intent | null,
            optionType: null,
            filterCategory: null as string | null,
            quickReplies: ["Book a bus", "Find a doctor", "Movie tickets"] as string[]
        };
    }
}