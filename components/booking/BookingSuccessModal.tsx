"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Download,
    Share2,
    Calendar,
    MapPin,
    X,
    Clock
} from "lucide-react";
import { BookingState } from "@/lib/chat/types";
import QRCode from "react-qr-code";

interface BookingSuccessModalProps {
    booking: BookingState;
    onClose: () => void;
}

export function BookingSuccessModal({ booking, onClose }: BookingSuccessModalProps) {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        setShowConfetti(true);
        const timer = setTimeout(() => setShowConfetti(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // Generate Booking Reference (PNR)
    const pnr = `SAH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const timestamp = new Date();
    const formattedTimestamp = timestamp.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // Extract details based on intent
    const isBus = booking.intent === "BUS_BOOKING";
    const title = isBus ? "Bus Ticket Confirmed" : "Booking Confirmed";

    // Get formatted data
    const { from, to, date: travelDate, time, specialist, movie, theater, showtime } = booking.collectedData || {};

    // Determine what to show based on booking type
    const serviceName = movie || specialist || from || "Service";
    const location = theater || to || "Confirmed Location";
    const bookingTime = time || showtime || "Confirmed Time";

    // Data to encode in QR Code
    const qrData = JSON.stringify({
        ref: pnr,
        service: serviceName,
        location: location,
        date: travelDate,
        time: bookingTime,
        issuedAt: timestamp.toISOString(),
        valid: true
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Confetti Effect */}
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
                    {/* Punch hole circles */}
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-background border border-border/50 z-10" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-background border border-border/50 z-10" />

                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/20 mb-4 animate-in zoom-in spin-in-12 duration-500">
                        <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-xl font-bold text-center">{title}</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-mono">Ref: {pnr}</p>
                </div>

                {/* Details Section */}
                <div className="p-6 space-y-6">
                    {/* Service Info */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Service</p>
                                <p className="font-bold text-lg leading-tight">{serviceName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Location</p>
                                <p className="font-medium">{location}</p>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-muted/40 p-4 rounded-2xl border border-border/30">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase font-bold">Date</span>
                            </div>
                            <p className="text-sm font-semibold">{travelDate || "Today"}</p>
                        </div>
                        <div className="space-y-1 border-l border-border/50 pl-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] uppercase font-bold">Time</span>
                            </div>
                            <p className="text-sm font-semibold">{bookingTime}</p>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-border/50">
                            <QRCode
                                value={qrData}
                                size={120}
                                level="M"
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-muted-foreground">Scan this QR code at the counter</p>
                            <p className="text-[9px] text-muted-foreground/60 mt-0.5">Issued: {formattedTimestamp}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button variant="outline" className="rounded-xl border-dashed h-11">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button className="rounded-xl h-11 shadow-lg shadow-primary/20">
                            <Download className="w-4 h-4 mr-2" />
                            Save Pass
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
