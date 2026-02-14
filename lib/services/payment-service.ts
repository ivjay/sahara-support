/**
 * Payment Gateway Service
 * Handles integration with eSewa, Khalti, and other payment gateways
 */

import crypto from 'crypto';

export type PaymentGateway = 'esewa' | 'khalti' | 'connectips' | 'cash';

export interface PaymentInitiationRequest {
    bookingId: string;
    amount: number;
    gateway: PaymentGateway;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

export interface PaymentInitiationResponse {
    success: boolean;
    paymentId?: string;
    paymentUrl?: string;
    formData?: Record<string, string>;
    error?: string;
}

export interface PaymentVerificationRequest {
    gateway: PaymentGateway;
    transactionId: string;
    amount: number;
    bookingId: string;
    gatewayData: any;
}

export interface PaymentVerificationResponse {
    success: boolean;
    transactionId?: string;
    error?: string;
    gatewayResponse?: any;
}

/**
 * eSewa Payment Integration
 */
export class ESewaPaymentService {
    private merchantCode: string;
    private secretKey: string;
    private successUrl: string;
    private failureUrl: string;
    private baseUrl: string;

    constructor() {
        this.merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';
        this.secretKey = process.env.ESEWA_SECRET_KEY || 'test_secret_key';
        this.successUrl = process.env.ESEWA_SUCCESS_URL || 'http://localhost:3000/api/payment/esewa/success';
        this.failureUrl = process.env.ESEWA_FAILURE_URL || 'http://localhost:3000/api/payment/esewa/failure';

        // Use sandbox URL if in development
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://esewa.com.np/epay/main'
            : 'https://uat.esewa.com.np/epay/main';
    }

    /**
     * Initiate eSewa payment
     */
    initiatePayment(request: PaymentInitiationRequest): PaymentInitiationResponse {
        try {
            const amount = request.amount.toFixed(2);
            const taxAmount = '0';
            const serviceCharge = '0';
            const deliveryCharge = '0';
            const totalAmount = amount;

            // eSewa payment form data
            const formData = {
                amt: amount,
                psc: serviceCharge,
                pdc: deliveryCharge,
                txAmt: taxAmount,
                tAmt: totalAmount,
                pid: request.bookingId,
                scd: this.merchantCode,
                su: this.successUrl,
                fu: this.failureUrl
            };

            return {
                success: true,
                paymentUrl: this.baseUrl,
                formData
            };
        } catch (error: any) {
            console.error('[eSewa] Payment initiation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to initiate eSewa payment'
            };
        }
    }

    /**
     * Verify eSewa payment
     */
    async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
        try {
            const { transactionId, amount, bookingId } = request;

            // eSewa verification endpoint
            const verifyUrl = process.env.NODE_ENV === 'production'
                ? 'https://esewa.com.np/epay/transrec'
                : 'https://uat.esewa.com.np/epay/transrec';

            const verifyParams = new URLSearchParams({
                amt: amount.toFixed(2),
                rid: transactionId,
                pid: bookingId,
                scd: this.merchantCode
            });

            const response = await fetch(`${verifyUrl}?${verifyParams.toString()}`);
            const xmlText = await response.text();

            // Parse eSewa XML response
            const isSuccess = xmlText.includes('<response_code>Success</response_code>');

            if (isSuccess) {
                return {
                    success: true,
                    transactionId,
                    gatewayResponse: { xml: xmlText, status: 'Success' }
                };
            } else {
                return {
                    success: false,
                    error: 'Payment verification failed',
                    gatewayResponse: { xml: xmlText }
                };
            }
        } catch (error: any) {
            console.error('[eSewa] Verification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to verify eSewa payment'
            };
        }
    }
}

/**
 * Khalti Payment Integration
 */
export class KhaltiPaymentService {
    private publicKey: string;
    private secretKey: string;
    private baseUrl: string;

    constructor() {
        this.publicKey = process.env.KHALTI_PUBLIC_KEY || 'test_public_key';
        this.secretKey = process.env.KHALTI_SECRET_KEY || 'test_secret_key';

        // Use test URL if in development
        this.baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://khalti.com/api/v2'
            : 'https://a.khalti.com/api/v2';
    }

    /**
     * Initiate Khalti payment
     */
    async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
        try {
            const payload = {
                return_url: process.env.KHALTI_RETURN_URL || 'http://localhost:3000/api/payment/khalti/callback',
                website_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                amount: request.amount * 100, // Khalti expects amount in paisa
                purchase_order_id: request.bookingId,
                purchase_order_name: `Booking ${request.bookingId}`,
                customer_info: {
                    name: request.customerName || 'Customer',
                    email: request.customerEmail || '',
                    phone: request.customerPhone || ''
                }
            };

            const response = await fetch(`${this.baseUrl}/epayment/initiate/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Khalti API error: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                paymentId: data.pidx,
                paymentUrl: data.payment_url
            };
        } catch (error: any) {
            console.error('[Khalti] Payment initiation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to initiate Khalti payment'
            };
        }
    }

    /**
     * Verify Khalti payment
     */
    async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
        try {
            const { transactionId } = request;

            const response = await fetch(`${this.baseUrl}/epayment/lookup/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${this.secretKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pidx: transactionId })
            });

            if (!response.ok) {
                throw new Error(`Khalti verification error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'Completed') {
                return {
                    success: true,
                    transactionId: data.transaction_id,
                    gatewayResponse: data
                };
            } else {
                return {
                    success: false,
                    error: `Payment status: ${data.status}`,
                    gatewayResponse: data
                };
            }
        } catch (error: any) {
            console.error('[Khalti] Verification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to verify Khalti payment'
            };
        }
    }
}

/**
 * Payment Service Factory
 */
export class PaymentService {
    static getService(gateway: PaymentGateway) {
        switch (gateway) {
            case 'esewa':
                return new ESewaPaymentService();
            case 'khalti':
                return new KhaltiPaymentService();
            case 'cash':
                return null; // Cash doesn't need a gateway service
            default:
                throw new Error(`Unsupported payment gateway: ${gateway}`);
        }
    }

    static async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
        if (request.gateway === 'cash') {
            return {
                success: true,
                paymentId: `CASH-${Date.now()}`
            };
        }

        const service = this.getService(request.gateway);
        if (!service) {
            return {
                success: false,
                error: 'Payment service not available'
            };
        }

        return service.initiatePayment(request);
    }

    static async verifyPayment(request: PaymentVerificationRequest): Promise<PaymentVerificationResponse> {
        if (request.gateway === 'cash') {
            return {
                success: true,
                transactionId: `CASH-${Date.now()}`
            };
        }

        const service = this.getService(request.gateway);
        if (!service) {
            return {
                success: false,
                error: 'Payment service not available'
            };
        }

        return service.verifyPayment(request);
    }
}
