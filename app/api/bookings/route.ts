import { NextResponse } from 'next/server';
import { db } from '@/lib/db/service';
import fs from 'fs/promises';
import path from 'path';
import { complete } from '@/lib/integrations/ollama-service';


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
 * PATCH /api/bookings - Update booking (for verification or details)
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing ID' },
                { status: 400 }
            );
        }

        if (status) {
            const validStatuses = ['Confirmed', 'Pending', 'Pending Payment', 'Cancelled', 'Completed'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: 'Invalid status', validStatuses },
                    { status: 400 }
                );
            }
        }

        // 1. Update local JSON DB
        const updated = await db.update(id, body);

        if (!updated) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        // 2. LEGIT LOGIC: Update Supabase if available (Single Source of Truth)
        if (status) {
            try {
                const { updateBookingStatus } = await import('@/lib/supabase');
                await updateBookingStatus(id, status.toLowerCase());
                console.log(`[API] ✓ Supabase booking ${id} updated to ${status}`);
            } catch (supabaseError) {
                console.warn('[API] Supabase update failed (non-critical):', supabaseError);
            }
        }

        // 3. LEGIT LOGIC: Send confirmation email if approved
        if (status === 'Confirmed') {
            try {
                const { sendBookingEmail } = await import('@/lib/email-service');
                await sendBookingEmail(id, updated.type, updated.details);
                console.log(`[API] ✓ Confirmation email triggered for ${id}`);
            } catch (emailError) {
                console.warn('[API] Email notification failed:', emailError);
            }
        }

        console.log(`[API] ✓ Booking ${id} updated`);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('[API] Update failed:', error);
        return NextResponse.json(
            { error: 'Update failed' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/bookings - Delete a booking or clear all
 */
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (id) {
            const success = await db.delete(id);
            if (!success) {
                return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
            }
            console.log(`[API] ✓ Booking ${id} deleted`);
            return NextResponse.json({ success: true, message: `Booking ${id} deleted` });
        }

        await db.clear();
        console.log('[API] ✓ All bookings cleared');
        return NextResponse.json({ success: true, message: 'All bookings cleared' });
    } catch (error) {
        console.error('[API] Failed to delete booking(s):', error);
        return NextResponse.json({ error: 'Failed to delete booking(s)' }, { status: 500 });
    }
}
