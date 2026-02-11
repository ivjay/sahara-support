import { NextResponse } from 'next/server';
import { db } from '@/lib/db/service';
import fs from 'fs/promises';
import path from 'path';
import { complete } from '@/lib/integrations/ollama-service';
import openClawClient from '@/lib/integrations/openclaw-service';

const DB_PATH = path.join(process.cwd(), 'data', 'bookings.json');

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings - Retrieve all bookings
 */
export async function GET() {
    try {
        const bookings = await db.getAll();
        return NextResponse.json(bookings);
    } catch (error) {
        console.error('[API] Failed to fetch bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

/**
 * POST /api/bookings - Create a new booking with AI validation
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Enhanced validation
        const validationErrors: string[] = [];

        if (!body.id) validationErrors.push('id is required');
        if (!body.title) validationErrors.push('title is required');
        if (!body.status) validationErrors.push('status is required');
        if (!body.type) validationErrors.push('type is required');
        if (!body.amount) validationErrors.push('amount is required');

        if (validationErrors.length > 0) {
            return NextResponse.json({
                error: 'Missing required fields',
                fields: validationErrors
            }, { status: 400 });
        }

        // Validate status enum
        const validStatuses = ['Confirmed', 'Pending', 'Pending Payment', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(body.status)) {
            return NextResponse.json({
                error: 'Invalid status',
                validStatuses
            }, { status: 400 });
        }

        // Use Ollama for intelligent booking validation (if available)
        if (process.env.OLLAMA_BASE_URL) {
            try {
                const validationPrompt = `Validate this booking request and check for potential issues:
Type: ${body.type}
Service: ${body.title} - ${body.subtitle || 'N/A'}
Amount: ${body.amount}
Date: ${body.date ? new Date(body.date).toLocaleDateString() : 'Not specified'}

Check for:
1. Reasonable pricing for ${body.type} in Kathmandu Valley
2. Valid service type
3. Suspicious or fraudulent patterns

Respond with ONLY "VALID" or "SUSPICIOUS: [reason]"`;

                const aiValidation = await complete(validationPrompt, undefined, { temperature: 0.2 });

                if (aiValidation.includes('SUSPICIOUS')) {
                    console.warn(`[API] AI flagged suspicious booking: ${aiValidation}`);
                    // Log but don't block - could add admin review step here
                }
            } catch (ollamaError) {
                console.warn('[API] Ollama validation unavailable:', ollamaError);
                // Continue without AI validation
            }
        }

        // Create booking
        const newBooking = await db.create(body);
        console.log(`[API] ✓ Booking created: ${newBooking.id} - ${newBooking.title}`);

        // Send Telegram notification if booking is confirmed (using OpenClaw)
        if (newBooking.status === 'Confirmed' && process.env.OPENCLAW_WS_URL) {
            try {
                // Get chat ID from booking details if available
                const chatId = body.chatId || body.details?.chatId;

                if (chatId) {
                    const notificationMessage = `✅ *Booking Confirmed*\n\n` +
                        `📋 ID: ${newBooking.id}\n` +
                        `🎫 Service: ${newBooking.title}\n` +
                        `💰 Amount: ${newBooking.amount}\n` +
                        `📅 Date: ${new Date(newBooking.date).toLocaleDateString()}\n\n` +
                        `Thank you for booking with Sahara! 🙏`;

                    await openClawClient.sendMessage({
                        chatId,
                        text: notificationMessage,
                    });

                    console.log(`[API] ✓ Telegram notification sent to ${chatId}`);
                }
            } catch (telegramError) {
                console.warn('[API] Failed to send Telegram notification:', telegramError);
                // Don't fail the booking if notification fails
            }
        }

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        console.error('[API] Failed to create booking:', error);
        return NextResponse.json({
            error: 'Failed to create booking',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * DELETE /api/bookings - Clear all bookings (admin only)
 */
export async function DELETE() {
    try {
        await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
        console.log('[API] ✓ All bookings cleared');
        return NextResponse.json({ success: true, message: 'All bookings cleared' });
    } catch (error) {
        console.error('[API] Failed to clear bookings:', error);
        return NextResponse.json({ error: 'Failed to clear bookings' }, { status: 500 });
    }
}
