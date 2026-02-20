import { NextResponse } from 'next/server';
import { db } from '@/lib/db/service';
import fs from 'fs/promises';
import path from 'path';


const DB_PATH = path.join(process.cwd(), 'data', 'bookings.json');

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings - Retrieve all bookings
 */
export async function GET() {
    try {
        // ✅ FIX: Try Supabase first (production), fall back to file DB
        let bookings = [];

        try {
            const { supabase } = await import('@/lib/supabase');
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                bookings = data.map((b: Record<string, unknown>) => {
                    const bookingData = (b.booking_data || b.details || {}) as Record<string, unknown>;
                    const status = b.status as string;
                    return {
                        id: b.id,
                        type: b.booking_type,
                        title: bookingData.title || b.booking_type,
                        subtitle: bookingData.subtitle || '',
                        status: status.charAt(0).toUpperCase() + status.slice(1),
                        amount: `NPR ${b.total_price}`,
                        date: new Date(b.created_at as string),
                        details: bookingData
                    };
                });
                console.log(`[API] ✓ Fetched ${bookings.length} bookings from Supabase`);
                return NextResponse.json(bookings);
            }
        } catch (supabaseError) {
            console.warn('[API] Supabase fetch failed, trying file DB:', supabaseError);
        }

        // Fallback to file DB
        bookings = await db.getAll();
        console.log(`[API] ✓ Fetched ${bookings.length} bookings from file DB`);
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

        // ✅ REMOVED: Ollama validation was causing timeouts and blocking bookings
        // Bookings should be fast and reliable - no AI validation needed

        let newBooking = body;

        // ✅ FIX: Try Supabase first (production-compatible), fall back to file DB
        try {
            const { createBooking } = await import('@/lib/supabase');

            // Parse price from "NPR 1500" format
            const priceMatch = body.amount.match(/[\d.]+/);
            const totalPrice = priceMatch ? parseFloat(priceMatch[0]) : 0;

            console.log('[API] Attempting Supabase booking creation:', {
                id: body.id,
                type: body.type,
                price: totalPrice,
                status: body.status,
                hasDetails: !!body.details
            });

            const supabaseBooking = await createBooking({
                booking_id: body.id,
                booking_type: body.type,
                details: body.details || {},
                total_price: totalPrice,
                status: body.status
            });

            console.log(`[API] ✓ Booking created in Supabase: ${body.id}`);
            newBooking = supabaseBooking || body;
        } catch (supabaseError) {
            const supabaseMsg = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
            console.error('[API] ✗ Supabase booking creation failed:', supabaseMsg);

            // Fallback to file-based DB (only works in development)
            try {
                console.log('[API] Attempting file DB fallback...');
                newBooking = await db.create(body);
                console.log(`[API] ✓ Booking created in file DB: ${newBooking.id}`);
            } catch (fileError) {
                const fileMsg = fileError instanceof Error ? fileError.message : String(fileError);
                console.error('[API] ✗ File DB also failed:', fileMsg);

                // Return detailed error for debugging
                return NextResponse.json({
                    error: 'Booking creation failed',
                    supabaseError: supabaseMsg,
                    fileDbError: fileMsg,
                    details: 'Both Supabase and file DB failed. Check database configuration and logs.'
                }, { status: 500 });
            }
        }

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('[API] Fatal error creating booking:', errorMsg);
        return NextResponse.json({
            error: 'Failed to create booking',
            message: errorMsg,
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
