import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/services/payment-service';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/payment/initiate
 * Initiates a payment transaction with the selected gateway
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bookingId, amount, gateway, customerName, customerEmail, customerPhone } = body;

        // Validation
        if (!bookingId || !amount || !gateway) {
            return NextResponse.json(
                { error: 'Missing required fields: bookingId, amount, gateway' },
                { status: 400 }
            );
        }

        if (amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        console.log('[Payment API] Initiating payment:', { bookingId, amount, gateway });

        // Create payment record in database
        const { data: payment, error: dbError } = await supabase
            .from('payments')
            .insert({
                booking_id: bookingId,
                gateway,
                amount,
                currency: 'NPR',
                status: 'pending'
            })
            .select()
            .single();

        if (dbError) {
            console.error('[Payment API] Database error:', dbError);
            return NextResponse.json(
                { error: 'Failed to create payment record' },
                { status: 500 }
            );
        }

        // Initiate payment with gateway
        const paymentResponse = await PaymentService.initiatePayment({
            bookingId,
            amount,
            gateway,
            customerName,
            customerEmail,
            customerPhone
        });

        if (!paymentResponse.success) {
            // Update payment status to failed
            await supabase
                .from('payments')
                .update({ status: 'failed' })
                .eq('id', payment.id);

            return NextResponse.json(
                { error: paymentResponse.error || 'Payment initiation failed' },
                { status: 500 }
            );
        }

        // Update payment record with gateway details
        await supabase
            .from('payments')
            .update({
                transaction_id: paymentResponse.paymentId,
                payment_url: paymentResponse.paymentUrl
            })
            .eq('id', payment.id);

        console.log('[Payment API] Payment initiated successfully:', paymentResponse);

        return NextResponse.json({
            success: true,
            paymentId: payment.id,
            transactionId: paymentResponse.paymentId,
            paymentUrl: paymentResponse.paymentUrl,
            formData: paymentResponse.formData,
            gateway
        });
    } catch (error) {
        console.error('[Payment API] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
