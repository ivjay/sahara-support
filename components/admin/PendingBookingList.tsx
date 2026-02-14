import { NextResponse } from 'next/server';
import { db } from '@/lib/db/service';

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
 * POST /api/bookings - Create a new booking
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validation
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

        // Validate status
        const validStatuses = ['Confirmed', 'Pending', 'Pending Payment', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(body.status)) {
            return NextResponse.json({
                error: 'Invalid status',
                validStatuses
            }, { status: 400 });
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
 * PATCH /api/bookings - Update booking status (for verification)
 */
export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'Missing ID or Status' },
                { status: 400 }
            );
        }

        const validStatuses = ['Confirmed', 'Pending', 'Pending Payment', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status', validStatuses },
                { status: 400 }
            );
        }

        const updated = await db.updateStatus(id, status);

        if (!updated) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            );
        }

        console.log(`[API] ✓ Booking ${id} updated to ${status}`);
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
 * DELETE /api/bookings - Clear all bookings (admin only)
 */
export async function DELETE() {
    try {

        await db.clear();
        console.log('[API] ✓ All bookings cleared');
        return NextResponse.json({ success: true, message: 'All bookings cleared' });
    } catch (error) {
        console.error('[API] Failed to clear bookings:', error);
        return NextResponse.json({ error: 'Failed to clear bookings' }, { status: 500 });
    }
}