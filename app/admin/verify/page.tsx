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
            alert(`✓ Booking ${newStatus === 'Confirmed' ? 'approved' : 'rejected'}!`);
        } catch (error) {
            console.error('Verification failed:', error);
            alert('❌ Failed to verify booking');
        }
    };

    return (
        <div className="min-h-screen bg-muted/10 p-6">
            <header className="max-w-5xl mx-auto mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/admin">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">Payment Verification</h1>
                </div>
                <p className="text-muted-foreground ml-12">
                    Review and approve pending payments
                </p>
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
                    <div className="space-y-4">
                        {pendingBookings.map((booking) => (
                            <Card key={booking.id} className="p-6 border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{booking.title}</h3>
                                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-none">
                                                {booking.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {booking.subtitle}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm bg-muted/30 p-4 rounded-xl border border-border/50">
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

                                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-40">
                                        <Button
                                            onClick={() => handleVerify(booking.id, 'Confirmed')}
                                            className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleVerify(booking.id, 'Cancelled')}
                                            variant="outline"
                                            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
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