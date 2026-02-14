"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function PaymentFailedPage() {
    const searchParams = useSearchParams();
    const bookingId = searchParams.get('bookingId');
    const reason = searchParams.get('reason');

    const getErrorMessage = () => {
        switch (reason) {
            case 'user_cancelled':
                return 'You cancelled the payment process.';
            case 'verification_failed':
                return 'Payment verification failed. Please contact support if amount was deducted.';
            case 'payment_not_found':
                return 'Payment record not found. Please try again.';
            case 'missing_params':
                return 'Invalid payment response received.';
            case 'server_error':
                return 'A server error occurred. Please try again later.';
            default:
                return 'Payment could not be completed.';
        }
    };

    const canRetry = reason !== 'verification_failed';

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8 space-y-6">
                {/* Error Icon */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-600 mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-gray-600">
                        {getErrorMessage()}
                    </p>
                </div>

                {/* Error Details */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
                    <h2 className="font-semibold text-lg mb-4">Details</h2>

                    {bookingId && bookingId !== 'unknown' && (
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-600">Booking ID:</span>
                            <span className="font-mono text-sm">{bookingId}</span>
                        </div>
                    )}

                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-red-600">✗ Failed</span>
                    </div>

                    {reason && (
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-600">Reason:</span>
                            <span className="text-sm text-gray-500 capitalize">
                                {reason.replace(/_/g, ' ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Information Card */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-2 text-amber-900 dark:text-amber-100">
                        What should I do?
                    </h3>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                        {canRetry && <li>✓ Try again with a different payment method</li>}
                        <li>✓ Check your internet connection</li>
                        <li>✓ Ensure your payment account has sufficient balance</li>
                        {reason === 'verification_failed' && (
                            <li className="text-red-600 font-semibold">
                                ⚠️ If amount was deducted, contact support immediately
                            </li>
                        )}
                    </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                        size="lg"
                    >
                        <Link href="/chat">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Chat
                        </Link>
                    </Button>

                    {canRetry && (
                        <Button
                            asChild
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            size="lg"
                        >
                            <Link href="/chat">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Support */}
                <div className="text-center space-y-1">
                    <p className="text-sm text-gray-600">
                        Having trouble? Contact our support team
                    </p>
                    {bookingId && bookingId !== 'unknown' && (
                        <p className="text-xs text-gray-500">
                            Reference: {bookingId}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    );
}
