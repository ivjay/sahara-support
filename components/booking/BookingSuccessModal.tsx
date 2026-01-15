"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Download,
    Share2,
    Calendar,
    MapPin,
    QrCode,
    X
} from "lucide-react";
import { BookingState } from "@/lib/chat/types";

interface BookingSuccessModalProps {
    booking: BookingState;
    onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setShowConfetti(true);
        // Reset confetti after animation
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Generate random PNR
    const pnr = `SAH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    // Extract details based on intent
    const isBus = booking.intent === "BUS_BOOKING";
    const title = isBus ? "Bus Ticket Confirmed" : "Booking Confirmed";

    // Get formatted data
    const { from, to, date: travelDate, time, specialist } = booking.collectedData || {};

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Confetti Effect (Simple CSS dots) */}
            {showConfetti && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-ping" style={{ animationDuration: '1s' }} />
                    <div className="absolute top-10 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
                    <div className="absolute top-20 left-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.4s' }} />
                </div>
            )}

            {/* Ticket Card */}
            <div className="relative w-full max-w-sm bg-background/95 backdrop-blur-md border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-10"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Header Section */}
                <div className="bg-primary/5 p-8 pb-10 flex flex-col items-center border-b border-dashed border-border relative">
                    {/* Punch hole circles for ticket effect */}
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-background border border-border/50 z-10" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-background border border-border/50 z-10" />

                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 mb-4 animate-in zoom-in spin-in-12 duration-500">
                        <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-bold text-center">{title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">Ref: {pnr}</p>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-6">
                    {/* Route / Service Info */}
                    <div className="flex items-center justify-between">
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground uppercase font-semibold">From / Type</p>
                            <p className="font-medium text-lg">{from || specialist || "Service"}</p>
                        </div>
                        {to && (
                            <>
                                <div className="flex-1 border-t-2 border-dashed border-border mx-4 relative top-1">
                                    <div className="absolute -top-1.5 right-0 w-2 h-2 bg-primary rounded-full" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">To</p>
                                    <p className="font-medium text-lg">{to}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Date</p>
                                <p className="text-sm font-medium">{travelDate || date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                                <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Time</p>
                                <p className="text-sm font-medium">{time || "10:00 AM"}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 border border-border rounded-xl bg-white/50 dark:bg-black/20">
                        <QrCode className="w-24 h-24 opacity-80" />
                        <p className="text-[10px] text-muted-foreground mt-2">Scan at counter</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="rounded-xl border-dashed">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button className="rounded-xl">
                            <Download className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
