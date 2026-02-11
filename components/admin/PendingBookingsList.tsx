"use client";

import React from "react";

import { useBookings, BookingRecord } from "@/lib/services/booking-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/chat/utils";

export function PendingBookingsList() {
    const { bookings, updateBookingStatus, refreshBookings } = useBookings();

    // Force refresh on mount to ensure latest data
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { refreshBookings(); }, []);

    // Filter for Pending Bookings (both 'Pending' and 'Pending Payment')
    // 'Pending' = Waiting for Admin Verification (from "I have paid")
    // 'Pending Payment' = Pay at Counter (No need to verify yet, or maybe mark as Paid when they arrive?)
    // The user request emphasizes verifying "I have paid".

    // We treat 'Pending' as needing verification.
    // We can also allow marking 'Pending Payment' as Confirmed (Counter Payment Received).
    const pendingBookings = bookings.filter(b => b.status === "Pending" || b.status === "Pending Payment");

    const handleVerify = async (id: string) => {
        console.log("[Admin] Verifying booking:", id);
        try {
            await updateBookingStatus(id, "Confirmed");
            console.log("[Admin] Verification successful");
        } catch (err) {
            console.error("[Admin] Verification failed:", err);
            alert("Failed to verify payment. Please try again.");
        }
    };

    const handleReject = async (id: string) => {
        console.log("[Admin] Rejecting booking:", id);
        try {
            await updateBookingStatus(id, "Cancelled");
            console.log("[Admin] Rejection successful");
        } catch (err) {
            console.error("[Admin] Rejection failed:", err);
            alert("Failed to reject booking. Please try again.");
        }
    };

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshBookings();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    Pending Actions
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                        {pendingBookings.length}
                    </span>
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className={`text-muted-foreground hover:text-foreground ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <Clock className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {pendingBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                    <CheckCircle2 className="w-10 h-10 mb-2 opacity-20" />
                    <p>No pending verifications</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingBookings.map((booking) => {
                        const isOnlineClaim = booking.status === "Pending";
                        const isPayAtCounter = booking.status === "Pending Payment";

                        return (
                            <Card key={booking.id} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 shadow-sm hover:shadow-md transition-shadow ${isOnlineClaim ? 'border-l-orange-500 bg-orange-50/10' : 'border-l-blue-500'}`}>

                                {/* Status Icon */}
                                <div className="shrink-0">
                                    {isOnlineClaim ? (
                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 animate-pulse">
                                            <AlertCircle className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-sm truncate">{booking.title}</h3>
                                        <div className="flex gap-1">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium uppercase tracking-wide">
                                                {booking.type}
                                            </span>
                                            {isOnlineClaim && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase tracking-wide border border-orange-200">
                                                    Verify Claim
                                                </span>
                                            )}
                                            {isPayAtCounter && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase tracking-wide border border-blue-200">
                                                    Pay at Counter
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {booking.subtitle} • {new Date(booking.date).toLocaleDateString()}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                                        <span>Ref: {booking.id.split('-')[1]?.toUpperCase() || booking.id}</span>
                                        <span>Amt: {booking.amount}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className={`${isOnlineClaim ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} h-8 text-xs gap-1.5`}
                                        onClick={() => handleVerify(booking.id)}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {isOnlineClaim ? "Approve Payment" : "Mark as Paid"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                        onClick={() => handleReject(booking.id)}
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
