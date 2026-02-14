import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/seats?venueId=xxx&serviceId=xxx&eventDate=xxx&eventTime=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const serviceId = searchParams.get('serviceId');
    const eventDate = searchParams.get('eventDate');
    const eventTime = searchParams.get('eventTime');

    if (!venueId || !serviceId || !eventDate || !eventTime) {
        return NextResponse.json(
            { error: 'Missing required parameters' },
            { status: 400 }
        );
    }

    try {
        // Get venue configuration
        const { data: venue, error: venueError } = await supabase
            .from('venues')
            .select('*')
            .eq('id', venueId)
            .single();

        if (venueError || !venue) {
            return NextResponse.json(
                { error: 'Venue not found' },
                { status: 404 }
            );
        }

        // Get seat inventory for this event
        const { data: seatInventory, error: inventoryError } = await supabase
            .from('seat_inventory')
            .select('*')
            .eq('venue_id', venueId)
            .eq('service_id', serviceId)
            .eq('event_date', eventDate)
            .eq('event_time', eventTime);

        if (inventoryError) {
            console.error('[Seats API] Inventory error:', inventoryError);
        }

        // If no inventory exists, create it from venue config
        if (!seatInventory || seatInventory.length === 0) {
            await initializeSeatInventory(venueId, serviceId, eventDate, eventTime, venue.seat_config);

            // Fetch again
            const { data: newInventory } = await supabase
                .from('seat_inventory')
                .select('*')
                .eq('venue_id', venueId)
                .eq('service_id', serviceId)
                .eq('event_date', eventDate)
                .eq('event_time', eventTime);

            return NextResponse.json({
                venue,
                seats: newInventory || []
            });
        }

        return NextResponse.json({
            venue,
            seats: seatInventory
        });
    } catch (error: any) {
        console.error('[Seats API] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// POST /api/seats/reserve
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { venueId, serviceId, eventDate, eventTime, seatLabels, sessionId } = body;

        if (!venueId || !serviceId || !eventDate || !eventTime || !seatLabels || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Call atomic reservation function
        const { data, error } = await supabase.rpc('reserve_seats', {
            p_venue_id: venueId,
            p_service_id: serviceId,
            p_event_date: eventDate,
            p_event_time: eventTime,
            p_seat_labels: seatLabels,
            p_session_id: sessionId,
            p_ttl_minutes: 10
        });

        if (error) {
            console.error('[Seats API] Reservation error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        const results = data as Array<{ seat_label: string; success: boolean; message: string }>;
        const failedSeats = results.filter(r => !r.success).map(r => r.seat_label);
        const success = failedSeats.length === 0;

        return NextResponse.json({
            success,
            failedSeats,
            expiry: success ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
            results
        });
    } catch (error: any) {
        console.error('[Seats API] Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Helper: Initialize seat inventory from venue config
async function initializeSeatInventory(
    venueId: string,
    serviceId: string,
    eventDate: string,
    eventTime: string,
    seatConfig: any
) {
    const seats: any[] = [];

    seatConfig.rows.forEach((row: any) => {
        row.seats.forEach((seat: any) => {
            if (seat) {
                const label = typeof seat.number === 'number'
                    ? `${row.label}${seat.number}`
                    : `${row.label}${seat.number}`;

                seats.push({
                    venue_id: venueId,
                    service_id: serviceId,
                    event_date: eventDate,
                    event_time: eventTime,
                    seat_label: label,
                    seat_type: seat.type || 'regular',
                    status: 'available'
                });
            }
        });
    });

    if (seats.length > 0) {
        await supabase.from('seat_inventory').insert(seats);
    }
}
