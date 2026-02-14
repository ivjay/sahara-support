import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/payment/esewa/success
 * Handles eSewa payment success callback
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // eSewa returns these parameters
        const oid = searchParams.get('oid'); // booking ID
        const amt = searchParams.get('amt'); // amount
        const refId = searchParams.get('refId'); // transaction reference ID

        console.log('[eSewa Success] Callback received:', { oid, amt, refId });

        if (!oid || !amt || !refId) {
            return NextResponse.redirect(
                new URL('/payment/failed?reason=missing_params', request.url)
            );
        }

        // Find payment record
        const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('booking_id', oid)
            .eq('gateway', 'esewa')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (findError || !payment) {
            console.error('[eSewa Success] Payment not found:', findError);
            return NextResponse.redirect(
                new URL('/payment/failed?reason=payment_not_found', request.url)
            );
        }

        // Verify payment with eSewa
        const verificationResult = await PaymentService.verifyPayment({
            gateway: 'esewa',
            transactionId: refId,
            amount: parseFloat(amt),
            bookingId: oid,
            gatewayData: { oid, amt, refId }
        });

        if (!verificationResult.success) {
            console.error('[eSewa Success] Verification failed:', verificationResult.error);

            // Update payment status to failed
            await supabase
                .from('payments')
                .update({
                    status: 'failed',
                    gateway_response: verificationResult.gatewayResponse,
                    completed_at: new Date().toISOString()
                })
                .eq('id', payment.id);

            return NextResponse.redirect(
                new URL('/payment/failed?reason=verification_failed', request.url)
            );
        }

        // Update payment status to success
        await supabase
            .from('payments')
            .update({
                status: 'success',
                transaction_id: refId,
                gateway_response: verificationResult.gatewayResponse,
                completed_at: new Date().toISOString()
            })
            .eq('id', payment.id);

        // Update booking status to confirmed
        await supabase
            .from('bookings')
            .update({
                status: 'Confirmed',
                payment_id: payment.id
            })
            .eq('id', oid);

        console.log('[eSewa Success] Payment verified and booking confirmed');

        // Redirect to success page
        return NextResponse.redirect(
            new URL(`/payment/success?bookingId=${oid}&transactionId=${refId}`, request.url)
        );
    } catch (error: any) {
        console.error('[eSewa Success] Error:', error);
        return NextResponse.redirect(
            new URL('/payment/failed?reason=server_error', request.url)
        );
    }
}
