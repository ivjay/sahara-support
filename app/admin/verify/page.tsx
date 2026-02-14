"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { BookingRecord } from "@/lib/services/booking-context";

export default function VerifyPage() {
    const [pendingBookings, setPendingBookings] = useState<BookingRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPendingBookings();
    }, []);

    const loadPendingBookings = async () => {
        try {
            const res = await fetch('/api/bookings', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch');

            const allBookings: BookingRecord[] = await res.json();

            // Filter for pending payments
            const pending = allBookings.filter(
                b => b.status === 'Pending Payment' || b.status === 'Pending' || b.status === 'Under Review'
            );

            setPendingBookings(pending);
        } catch (error) {
            console.error('Failed to load pending bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: string, newStatus: 'Confirmed' | 'Cancelled') => {
        try {
            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (!res.ok) throw new Error('Verification failed');

            setPendingBookings(prev => prev.filter(b => b.id !== id));
            // Using browser notification instead of alert
            const message = `Booking ${newStatus === 'Confirmed' ? 'approved' : 'rejected'} successfully`;
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Booking Updated', { body: message });
            } else {
                alert(message);
            }
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Failed to verify booking. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-muted/10 p-6 relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 bg-pattern-geo opacity-30 pointer-events-none" />

            <header className="max-w-5xl mx-auto mb-6 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payment Verification</h1>
                        <p className="text-sm text-muted-foreground">
                            Review and approve pending payments
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                {loading ? (
                    <div className="text-center py-12">
                        <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                ) : pendingBookings.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Check className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                        <p className="text-muted-foreground">No pending payments to verify</p>
                    </Card>
                ) : (
                    <div className="space-y-4 relative z-10">
                        {pendingBookings.map((booking) => (
                            <Card key={booking.id} className="p-6 border-l-4 border-l-orange-500 dark:border-l-orange-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
                                {/* Subtle background decoration */}
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/5 dark:bg-orange-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                                <div className="flex flex-col md:flex-row items-start justify-between gap-6 relative z-10">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{booking.title}</h3>
                                            <Badge className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-400 hover:from-orange-200 hover:to-amber-200 dark:hover:from-orange-900/40 dark:hover:to-amber-900/40 border-none shadow-sm">
                                                {booking.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {booking.subtitle}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm bg-gradient-to-br from-muted/30 to-muted/20 dark:from-muted/20 dark:to-muted/10 p-5 rounded-xl border border-border/50 shadow-sm">
                                            <div>
                                                <span className="text-muted-foreground block mb-1">Booking ID</span>
                                                <p className="font-mono bg-white px-2 py-1 rounded border text-[12px]">{booking.id}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block mb-1">Amount to Verify</span>
                                                <p className="font-bold text-lg text-primary">{booking.amount}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block mb-1">Created Date</span>
                                                <p>{new Date(booking.date).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground block mb-1">Service Type</span>
                                                <p className="capitalize">{booking.type}</p>
                                            </div>

                                            {/* ✅ FIX: Check if details exists before mapping */}
                                            {booking.details && Object.entries(booking.details).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-muted-foreground block mb-1 capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <p className="font-medium">{String(value) || 'N/A'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-44">
                                        <Button
                                            onClick={() => handleVerify(booking.id, 'Confirmed')}
                                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 hover:-translate-y-0.5"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleVerify(booking.id, 'Cancelled')}
                                            variant="outline"
                                            className="flex-1 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-400 dark:hover:border-red-700 transition-all duration-300 hover:-translate-y-0.5"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}