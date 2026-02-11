import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

export async function GET() {
    try {
        // Check if Supabase is configured
        const connectionStatus = await checkSupabaseConnection();

        if (!connectionStatus.configured) {
            return NextResponse.json({
                success: false,
                message: '⚠️  Supabase not configured',
                hint: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local',
            }, { status: 503 });
        }

        if (!connectionStatus.connected) {
            return NextResponse.json({
                success: false,
                message: '❌ Database connection failed',
                error: connectionStatus.error,
            }, { status: 500 });
        }

        // Test 1: Count bookings
        const { count: bookingCount, error: bookingError } = await supabase!
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        if (bookingError) throw bookingError;

        // Test 2: Count conversations
        const { count: convCount, error: convError } = await supabase!
            .from('conversations')
            .select('*', { count: 'exact', head: true });

        if (convError) throw convError;

        // Test 3: Fetch latest booking
        const { data: latestBooking } = await supabase!
            .from('bookings')
            .select('booking_id, booking_type, created_at')
            .order('created_at', { ascending: false })
            .limit(1);

        return NextResponse.json({
            success: true,
            message: 'Database connection successful! ✅',
            stats: {
                bookings: bookingCount || 0,
                conversations: convCount || 0,
            },
            latest_booking: latestBooking?.[0] || null,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: '❌ Database error',
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}
