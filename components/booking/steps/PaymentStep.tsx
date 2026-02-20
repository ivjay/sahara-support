"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";
import Image from "next/image";

type PaymentGateway = 'esewa' | 'khalti' | 'cash';

interface PassengerInfo {
    fullName: string;
    phone?: string;
    email?: string;
}

interface BookingData {
    serviceId: string;
    serviceType: string;
    serviceTitle: string;
    serviceSubtitle?: string;
    serviceDetails?: Record<string, string | undefined>;
    date: string;
    time: string;
    passengers?: PassengerInfo[];
    seats?: string[];
}

interface PaymentStepProps {
    totalPrice: number;
    currency: string;
    onPaymentSelect: (method: 'qr' | 'cash') => void;
    onComplete: (bookingId: string) => void;
    bookingData: BookingData;
}

export function PaymentStep({
    totalPrice,
    currency,
    onPaymentSelect,
    onComplete,
    bookingData
}: PaymentStepProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentGateway | null>(null);
    const [processing, setProcessing] = useState(false);
    const [initiatingPayment, setInitiatingPayment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const esewaFormRef = useRef<HTMLFormElement>(null);

    async function handleConfirm() {
        if (!selectedMethod) return;

        // Clear previous errors
        setError(null);

        // Handle cash payment directly
        if (selectedMethod === 'cash') {
            await handleCashPayment();
            return;
        }

        // Handle digital payment (eSewa or Khalti)
        await handleDigitalPayment(selectedMethod);
    }

    async function handleCashPayment() {
        setProcessing(true);
        setError(null); // Clear any previous errors

        try {
            const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;

            const bookingPayload = {
                id: bookingId,
                serviceId: bookingData.serviceId,
                type: bookingData.serviceType,
                title: bookingData.serviceTitle || bookingData.serviceId,
                subtitle: bookingData.serviceSubtitle || '',
                status: 'Confirmed',
                amount: `${currency} ${totalPrice}`,
                date: bookingData.date, // ✅ Keep as string, don't convert to Date object
                details: {
                    // Merge all service details (from, to, departure, duration, busType, aircraft, etc.)
                    ...(bookingData.serviceDetails || {}),
                    // User-specific booking data (override service defaults)
                    serviceId: bookingData.serviceId,
                    serviceType: bookingData.serviceType,
                    date: bookingData.date,
                    time: (bookingData.time && bookingData.time !== 'all-day')
                        ? bookingData.time
                        : (bookingData.serviceDetails?.departure || bookingData.time || 'N/A'),
                    passengerCount: bookingData.passengers?.length || 1,
                    passengers: bookingData.passengers || [],
                    seats: bookingData.seats || [],
                    totalPrice: totalPrice,
                    currency: currency,
                    paymentMethod: 'cash'
                }
            };

            console.log('[PaymentStep] Creating cash booking:', bookingPayload);

            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: response.statusText }));
                console.error('[PaymentStep] Booking API error:', errorData);
                throw new Error(errorData.error || errorData.details || `Booking failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('[PaymentStep] ✓ Cash booking created:', result);

            onPaymentSelect('cash');
            onComplete(result.id || bookingId);
        } catch (error) {
            console.error('[PaymentStep] ✗ Cash booking failed:', error);
            setError(error instanceof Error ? error.message : 'Booking failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    }

    async function handleDigitalPayment(gateway: 'esewa' | 'khalti') {
        setInitiatingPayment(true);
        setError(null); // Clear any previous errors

        try {
            const bookingId = `BK-${Date.now().toString(36).toUpperCase()}`;

            // Create booking first
            const bookingPayload = {
                id: bookingId,
                serviceId: bookingData.serviceId,
                type: bookingData.serviceType,
                title: bookingData.serviceTitle || bookingData.serviceId,
                subtitle: bookingData.serviceSubtitle || '',
                status: 'Pending Payment',
                amount: `${currency} ${totalPrice}`,
                date: bookingData.date, // ✅ Keep as string
                details: {
                    // Merge all service details (from, to, departure, duration, busType, aircraft, etc.)
                    ...(bookingData.serviceDetails || {}),
                    // User-specific booking data (override service defaults)
                    serviceId: bookingData.serviceId,
                    serviceType: bookingData.serviceType,
                    date: bookingData.date,
                    time: (bookingData.time && bookingData.time !== 'all-day')
                        ? bookingData.time
                        : (bookingData.serviceDetails?.departure || bookingData.time || 'N/A'),
                    passengerCount: bookingData.passengers?.length || 1,
                    passengers: bookingData.passengers || [],
                    seats: bookingData.seats || [],
                    totalPrice: totalPrice,
                    currency: currency,
                    paymentMethod: gateway
                }
            };

            const bookingResponse = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload)
            });

            if (!bookingResponse.ok) throw new Error('Failed to create booking');

            const booking = await bookingResponse.json();
            console.log('[PaymentStep] Booking created:', booking);

            // Initiate payment
            const customerInfo = bookingData.passengers?.[0] || { fullName: '', email: '', phone: '' };
            const paymentResponse = await fetch('/api/payment/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id || bookingId,
                    amount: totalPrice,
                    gateway,
                    customerName: customerInfo.fullName || 'Customer',
                    customerEmail: customerInfo.email || '',
                    customerPhone: customerInfo.phone || ''
                })
            });

            if (!paymentResponse.ok) throw new Error('Failed to initiate payment');

            const paymentData = await paymentResponse.json();
            console.log('[PaymentStep] Payment initiated:', paymentData);

            if (gateway === 'esewa' && paymentData.formData) {
                // For eSewa, submit form to redirect to payment page
                submitEsewaForm(paymentData.paymentUrl, paymentData.formData);
            } else if (gateway === 'khalti' && paymentData.paymentUrl) {
                // For Khalti, redirect to payment URL
                window.location.href = paymentData.paymentUrl;
            }
        } catch (error) {
            console.error('[PaymentStep] Digital payment failed:', error);
            setError(error instanceof Error ? error.message : 'Payment initiation failed. Please try again.');
            setInitiatingPayment(false);
        }
    }

    function submitEsewaForm(url: string, formData: Record<string, string>) {
        // Create and submit eSewa form
        const form = esewaFormRef.current;
        if (!form) return;

        // Set form action
        form.action = url;

        // Clear existing inputs
        form.innerHTML = '';

        // Add form fields
        Object.entries(formData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
        });

        // Submit form
        form.submit();
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
                <p className="text-gray-600 mb-4">Total: {currency} {totalPrice}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* eSewa Payment */}
                <Card
                    className={`p-6 cursor-pointer transition-all ${
                        selectedMethod === 'esewa'
                            ? 'border-green-500 border-2 bg-green-50 dark:bg-green-950/20'
                            : 'hover:border-green-300'
                    }`}
                    onClick={() => setSelectedMethod('esewa')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <div className="text-3xl font-bold text-green-600">e</div>
                        </div>
                        <h4 className="font-semibold mb-1">eSewa</h4>
                        <p className="text-xs text-gray-600">Most Popular</p>
                        <p className="text-xs text-green-600 mt-1">Instant ✓</p>
                    </div>
                </Card>

                {/* Khalti Payment */}
                <Card
                    className={`p-6 cursor-pointer transition-all ${
                        selectedMethod === 'khalti'
                            ? 'border-purple-500 border-2 bg-purple-50 dark:bg-purple-950/20'
                            : 'hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedMethod('khalti')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                            <div className="text-3xl font-bold text-purple-600">K</div>
                        </div>
                        <h4 className="font-semibold mb-1">Khalti</h4>
                        <p className="text-xs text-gray-600">Digital Wallet</p>
                        <p className="text-xs text-purple-600 mt-1">Instant ✓</p>
                    </div>
                </Card>

                {/* Cash Payment */}
                <Card
                    className={`p-6 cursor-pointer transition-all ${
                        selectedMethod === 'cash'
                            ? 'border-primary border-2 bg-primary/5'
                            : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMethod('cash')}
                >
                    <div className="text-center">
                        <Wallet className="w-12 h-12 mx-auto mb-3 text-primary" />
                        <h4 className="font-semibold mb-1">Pay at Counter</h4>
                        <p className="text-xs text-gray-600">Reserve now</p>
                        <p className="text-xs text-blue-600 mt-1">Pay later</p>
                    </div>
                </Card>
            </div>

            {/* Payment instructions */}
            {selectedMethod && selectedMethod !== 'cash' && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Next step:</strong> You'll be redirected to {selectedMethod === 'esewa' ? 'eSewa' : 'Khalti'} to complete your payment securely.
                    </p>
                </Card>
            )}

            {selectedMethod === 'cash' && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                        <strong>Note:</strong> Please bring cash payment when you arrive at the counter.
                    </p>
                </Card>
            )}

            {/* Error message */}
            {error && (
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <p className="text-sm text-destructive font-medium">{error}</p>
                </Card>
            )}

            <Button
                onClick={handleConfirm}
                disabled={!selectedMethod || processing || initiatingPayment}
                className="w-full"
                size="lg"
            >
                {initiatingPayment ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Redirecting to payment...
                    </>
                ) : processing ? (
                    'Processing...'
                ) : selectedMethod === 'cash' ? (
                    'Confirm Reservation'
                ) : (
                    'Proceed to Payment'
                )}
            </Button>

            {/* Hidden form for eSewa submission */}
            <form ref={esewaFormRef} method="POST" style={{ display: 'none' }} />
        </div>
    );
}
