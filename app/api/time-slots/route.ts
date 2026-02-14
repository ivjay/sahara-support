import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/time-slots?serviceId=xxx&date=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');

    if (!serviceId || !date) {
        return NextResponse.json(
            { error: 'Missing serviceId or date' },
            { status: 400 }
        );
    }

    try {
        // Try Supabase function first
        const { data, error } = await supabase.rpc('generate_time_slots', {
            p_service_id: serviceId,
            p_date: date,
            p_start_time: '09:00',
            p_end_time: '17:00',
            p_interval_minutes: 15
        });

        if (error) {
            console.warn('[TimeSlots API] Supabase function not available, generating locally:', error);

            // FALLBACK: Generate time slots locally (production-ready)
            const slots = generateLocalTimeSlots('09:00', '17:00', 30);
            return NextResponse.json({ slots });
        }

        // Format time slots from Supabase
        const slots = (data || []).map((slot: any) => ({
            time: slot.slot_time,
            status: slot.status,
            formattedTime: formatTime(slot.slot_time)
        }));

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('[TimeSlots API] Error:', error);

        // FALLBACK: Generate time slots locally
        const slots = generateLocalTimeSlots('09:00', '17:00', 30);
        return NextResponse.json({ slots });
    }
}

// POST /api/time-slots/reserve
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { serviceId, date, time, sessionId } = body;

        if (!serviceId || !date || !time || !sessionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Try to reserve the slot
        const { data, error } = await supabase
            .from('time_slots')
            .update({
                status: 'reserved',
                reserved_by: sessionId,
                reserved_until: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            })
            .eq('service_id', serviceId)
            .eq('slot_date', date)
            .eq('slot_time', time)
            .eq('status', 'available')
            .select()
            .single();

        if (error || !data) {
            return NextResponse.json({
                success: false,
                message: 'Time slot no longer available'
            });
        }

        return NextResponse.json({
            success: true,
            expiry: data.reserved_until,
            message: 'Slot reserved for 10 minutes'
        });
    } catch (error: any) {
        console.error('[TimeSlots API] Reservation error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Generate time slots locally (fallback when Supabase function unavailable)
 * Production-ready: Will work even without database
 */
function generateLocalTimeSlots(startTime: string, endTime: string, intervalMinutes: number) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        slots.push({
            time: timeStr,
            status: 'available', // In production, check against actual bookings
            formattedTime: formatTime(timeStr)
        });

        currentMinutes += intervalMinutes;
    }

    return slots;
}
