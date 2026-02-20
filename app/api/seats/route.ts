import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { VenueRow, SeatInventoryRow, ReserveSeatResult } from '@/lib/types/rpc-responses';
import { ErrorTypes, handleApiError, validateRequiredFields, createSuccessResponse } from '@/lib/api/error-handler';
import { getCachedSeatInventory, cacheSeatInventory, invalidateSeatCache } from '@/lib/cache/redis';

// GET /api/seats?venueId=xxx&serviceId=xxx&eventDate=xxx&eventTime=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const venueId = searchParams.get('venueId');
        const serviceId = searchParams.get('serviceId');
        const eventDate = searchParams.get('eventDate');
        let eventTime = searchParams.get('eventTime');

        // Handle null/undefined event time
        if (eventTime === 'null' || eventTime === 'undefined' || !eventTime) {
            eventTime = 'all-day';
        }

        // Validate required parameters
        if (!venueId || !serviceId || !eventDate) {
            throw ErrorTypes.BAD_REQUEST('Missing required parameters: venueId, serviceId, eventDate');
        }

        // ⚡ TRY CACHE FIRST (60x faster)
        const cachedSeats = await getCachedSeatInventory(venueId, serviceId, eventDate, eventTime);
        if (cachedSeats) {
            // Get venue (cached separately or quick DB fetch)
            const { data: venue } = await supabase.from('venues').select('*').eq('id', venueId).single();
            return createSuccessResponse({
                venue: venue as VenueRow,
                seats: cachedSeats,
                cached: true
            });
        }

        // Cache miss - fetch from DB
        const { data: venue, error: venueError } = await supabase
            .from('venues')
            .select('*')
            .eq('id', venueId)
            .single();

        if (venueError || !venue) {
            throw ErrorTypes.NOT_FOUND('Venue not found', { venueId });
        }

        const typedVenue = venue as VenueRow;

        // Get seat inventory
        const { data: seatInventory, error: inventoryError } = await supabase
            .from('seat_inventory')
            .select('*')
            .eq('venue_id', venueId)
            .eq('service_id', serviceId)
            .eq('event_date', eventDate)
            .eq('event_time', eventTime);

        if (inventoryError) {
            throw ErrorTypes.INTERNAL_SERVER('Failed to fetch seat inventory', inventoryError);
        }

        // If no inventory exists, create it
        if (!seatInventory || seatInventory.length === 0) {
            await initializeSeatInventory(venueId, serviceId, eventDate, eventTime, typedVenue.seat_config);

            const { data: newInventory, error: newInventoryError } = await supabase
                .from('seat_inventory')
                .select('*')
                .eq('venue_id', venueId)
                .eq('service_id', serviceId)
                .eq('event_date', eventDate)
                .eq('event_time', eventTime);

            if (newInventoryError) {
                throw ErrorTypes.INTERNAL_SERVER('Failed to fetch created inventory', newInventoryError);
            }

            const seats = (newInventory || []) as SeatInventoryRow[];

            // ⚡ CACHE IT (1 min TTL)
            await cacheSeatInventory(venueId, serviceId, eventDate, eventTime, seats);

            return createSuccessResponse({ venue: typedVenue, seats });
        }

        const seats = seatInventory as SeatInventoryRow[];

        // ⚡ CACHE IT (1 min TTL)
        await cacheSeatInventory(venueId, serviceId, eventDate, eventTime, seats);

        return createSuccessResponse({ venue: typedVenue, seats });
    } catch (error) {
        return handleApiError(error, '/api/seats');
    }
}

// POST /api/seats/reserve
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { venueId, serviceId, eventDate, eventTime, seatLabels, sessionId } = body;

        // Handle null/undefined event time
        if (eventTime === 'null' || eventTime === 'undefined' || !eventTime) {
            eventTime = 'all-day';
        }

        // Validate required fields
        validateRequiredFields(body, ['venueId', 'serviceId', 'eventDate', 'seatLabels', 'sessionId']);

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
            console.error('[Seats API] RPC reserve_seats failed:', error);
            throw ErrorTypes.INTERNAL_SERVER('Seat reservation failed', {
                code: error.code,
                message: error.message,
                hint: error.hint
            });
        }

        const results = data as ReserveSeatResult[];
        const failedSeats = results.filter(r => !r.success).map(r => r.seat_label);
        const success = failedSeats.length === 0;

        // ⚡ INVALIDATE CACHE (seats changed)
        if (success) {
            await invalidateSeatCache(venueId, serviceId, eventDate, eventTime);
        }

        return createSuccessResponse({
            success,
            failedSeats,
            expiry: success ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
            results
        });
    } catch (error) {
        return handleApiError(error, '/api/seats/reserve');
    }
}

// Helper: Initialize seat inventory from venue config
async function initializeSeatInventory(
    venueId: string,
    serviceId: string,
    eventDate: string,
    eventTime: string,
    seatConfig: VenueRow['seat_config']
): Promise<void> {
    // Safety check: ensure seatConfig and seatConfig.rows exist
    if (!seatConfig || !seatConfig.rows || !Array.isArray(seatConfig.rows)) {
        console.warn(`[Seats API] Missing or invalid seat configuration for venue: ${venueId}`);
        return;
    }

    try {
        const seats: Array<{
            venue_id: string;
            service_id: string;
            event_date: string;
            event_time: string;
            seat_label: string;
            seat_type: 'regular' | 'premium' | 'vip' | 'disabled';
            status: 'available';
        }> = [];

        seatConfig.rows.forEach((row) => {
            if (!row || !row.seats || !Array.isArray(row.seats)) return;

            row.seats.forEach((seat) => {
                if (seat) {
                    // Compute label same as SeatGrid and ConsolidatedSeatSelection
                    const label = seat.label || `${row.label}${seat.number}`;

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
            const { error } = await supabase.from('seat_inventory').insert(seats);
            if (error) {
                console.error('[Seats API] Error inserting inventory:', error);
                throw ErrorTypes.INTERNAL_SERVER('Failed to initialize seat inventory', error);
            }
        }
    } catch (e) {
        console.error('[Seats API] Failed to initialize inventory:', e);
        throw e;
    }
}
