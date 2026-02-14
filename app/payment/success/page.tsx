"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Download } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('bookingId');
    const transactionId = searchParams.get('transactionId');
    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState<any>(null);

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    async function fetchBookingDetails() {
        try {
            const response = await fetch(`/api/bookings?id=${bookingId}`);
            if (response.ok) {
                const data = await response.json();
                setBookingDetails(data);
            }
        } catch (error) {
            console.error('Failed to fetch booking details:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8 space-y-6">
                {/* Success Icon */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-green-600 mb-2">
                        Payment Successful! 🎉
                    </h1>
                    <p className="text-gray-600">
                        Your booking has been confirmed
                    </p>
                </div>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
                    <h2 className="font-semibold text-lg mb-4">Transaction Details</h2>

                    {bookingId && (
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Booking ID:</span>
                            <span className="font-semibold text-primary">{bookingId}</span>
                        </div>
                    )}

                    {transactionId && (
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Transaction ID:</span>
                            <span className="font-mono text-sm">{transactionId}</span>
                        </div>
                    )}

                    {bookingDetails && (
                        <>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Service:</span>
                                <span className="font-medium">{bookingDetails.title}</span>
                            </div>

                            <div className="flex justify-between border-b pb-2">
                                <span className="text-gray-600">Amount Paid:</span>
                                <span className="font-bold text-green-600 text-lg">
                                    {bookingDetails.amount}
                                </span>
                            </div>

                            {bookingDetails.details?.date && (
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">
                                        {new Date(bookingDetails.details.date).toLocaleDateString()}
                                    </span>
                                </div>
                            )}

                            {bookingDetails.details?.time && (
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium">{bookingDetails.details.time}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="flex justify-between pt-2">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-green-600">✓ Confirmed</span>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                        What's Next?
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>✓ A confirmation has been sent to your phone/email</li>
                        <li>✓ Save your Booking ID for reference</li>
                        <li>✓ Please arrive 15-30 minutes early</li>
                        <li>✓ Bring a valid ID for verification</li>
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        asChild
                        className="flex-1"
                        size="lg"
                    >
                        <Link href="/chat">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Back to Chat
                        </Link>
                    </Button>

                    {bookingId && (
                        <Button
                            variant="outline"
                            className="flex-1"
                            size="lg"
                            onClick={() => window.print()}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Print Receipt
                        </Button>
                    )}
                </div>

                {/* Support */}
                <p className="text-center text-sm text-gray-500">
                    Need help? Contact support with your booking ID
                </p>
            </Card>
        </div>
    );
}
