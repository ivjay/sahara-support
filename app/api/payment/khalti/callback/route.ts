import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/payment/khalti/callback
 * Handles Khalti payment callback
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        // Khalti returns these parameters
        const pidx = searchParams.get('pidx'); // payment index
        const txnId = searchParams.get('transaction_id');
        const amount = searchParams.get('amount');
        const purchaseOrderId = searchParams.get('purchase_order_id');
        const status = searchParams.get('status');

        console.log('[Khalti Callback] Received:', { pidx, txnId, purchaseOrderId, status });

        if (!pidx) {
            return NextResponse.redirect(
                new URL('/payment/failed?reason=missing_params', request.url)
            );
        }

        // Find payment record
        const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('transaction_id', pidx)
            .eq('gateway', 'khalti')
            .single();

        if (findError || !payment) {
            console.error('[Khalti Callback] Payment not found:', findError);
            return NextResponse.redirect(
                new URL('/payment/failed?reason=payment_not_found', request.url)
            );
        }

        // Verify payment with Khalti
        const verificationResult = await PaymentService.verifyPayment({
            gateway: 'khalti',
            transactionId: pidx,
            amount: payment.amount,
            bookingId: payment.booking_id,
            gatewayData: { pidx, txnId, amount, purchaseOrderId, status }
        });

        if (!verificationResult.success) {
            console.error('[Khalti Callback] Verification failed:', verificationResult.error);

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
                transaction_id: verificationResult.transactionId,
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
            .eq('id', payment.booking_id);

        console.log('[Khalti Callback] Payment verified and booking confirmed');

        // Redirect to success page
        return NextResponse.redirect(
            new URL(`/payment/success?bookingId=${payment.booking_id}&transactionId=${verificationResult.transactionId}`, request.url)
        );
    } catch (error: any) {
        console.error('[Khalti Callback] Error:', error);
        return NextResponse.redirect(
            new URL('/payment/failed?reason=server_error', request.url)
        );
    }
}
