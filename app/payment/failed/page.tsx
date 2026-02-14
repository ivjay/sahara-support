"use client";

import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function PaymentFailedContent() {
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-pattern-geo opacity-50" />
            <div className="absolute top-10 left-10 w-64 h-64 bg-red-400/15 dark:bg-red-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-orange-400/15 dark:bg-orange-600/10 rounded-full blur-3xl" />

            <Card className="max-w-2xl w-full p-8 space-y-6 shadow-2xl relative z-10 border-2 border-red-100 dark:border-red-900/30">
                {/* Error Icon */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full mb-4 shadow-lg shadow-red-500/20 animate-pop-in">
                        <XCircle className="w-14 h-14 text-red-600 dark:text-red-500" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-500 dark:to-orange-500 bg-clip-text text-transparent mb-2">
                        Payment Failed
                    </h1>
                    <p className="text-muted-foreground">
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
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                            <span className="font-semibold text-red-600 dark:text-red-500">Failed</span>
                        </div>
                    </div>

                    {reason && (
                        <div className="flex justify-between pt-2">
                            <span className="text-gray-600 dark:text-gray-400">Reason:</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {reason.replace(/_/g, ' ')}
                            </span>
                        </div>
                    )}
                </div>

                {/* Information Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        What should I do?
                    </h3>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
                        {canRetry && (
                            <li className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <span>Try again with a different payment method</span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>Check your internet connection</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <span>Ensure your payment account has sufficient balance</span>
                        </li>
                        {reason === 'verification_failed' && (
                            <li className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 -mx-1">
                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
                                <span className="text-red-700 dark:text-red-400 font-semibold">
                                    If amount was deducted, contact support immediately
                                </span>
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

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
