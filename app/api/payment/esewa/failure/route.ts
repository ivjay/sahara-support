import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/payment/esewa/failure
 * Handles eSewa payment failure callback
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const pid = searchParams.get('pid'); // booking ID

        console.log('[eSewa Failure] Callback received:', { pid });

        if (pid) {
            // Find and update payment record
            const { data: payment } = await supabase
                .from('payments')
                .select('*')
                .eq('booking_id', pid)
                .eq('gateway', 'esewa')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (payment) {
                await supabase
                    .from('payments')
                    .update({
                        status: 'failed',
                        gateway_response: { error: 'User cancelled or payment failed' },
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', payment.id);

                // Update booking status
                await supabase
                    .from('bookings')
                    .update({ status: 'Payment Failed' })
                    .eq('id', pid);
            }
        }

        // Redirect to failure page
        return NextResponse.redirect(
            new URL(`/payment/failed?bookingId=${pid || 'unknown'}&reason=user_cancelled`, request.url)
        );
    } catch (error) {
        console.error('[eSewa Failure] Error:', error);
        return NextResponse.redirect(
            new URL('/payment/failed?reason=server_error', request.url)
        );
    }
}
