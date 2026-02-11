"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Share2, Download, Calendar, MapPin, Ticket } from "lucide-react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

interface ReceiptCardProps {
    data: {
        id: string; // PNR
        serviceName: string;
        location: string;
        date: string;
        time: string;
        price: string;
        status: "Confirmed" | "Pending Payment";
        userName: string;
        userPhone: string;
        timestamp: string;
    };
    onShare?: () => void;
}

export function ReceiptCard({ data }: ReceiptCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Determine Status Styles
    const isPaid = data.status === "Confirmed";
    const isPayAtCounter = data.status === "Pending Payment"; // ✅ Check actual status
    const statusColor = isPaid ? "bg-green-500" : "bg-orange-500";
    const statusBg = isPaid ? "bg-green-500/10 text-green-700 dark:text-green-300" : "bg-orange-500/10 text-orange-700 dark:text-orange-300";
    const StatusIcon = isPaid ? CheckCircle2 : Clock;

    // Title logic: Pay at Counter bookings show different title
    const title = isPayAtCounter
        ? "Reservation Confirmed"
        : (isPaid ? "Payment Verified" : "Reservation Pending");

    // Handle Save as Image
    const handleSaveImage = async () => {
        if (!cardRef.current) return;
        setIsSaving(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2 // High res
            });
            const link = document.createElement('a');
            link.download = `Sahara_Receipt_${data.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Failed to save receipt", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 max-w-sm mt-2">
            {/* Downloadable Area */}
            <div
                ref={cardRef}
                className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-lg"
            >
                {/* Header */}
                <div className={`p-6 flex flex-col items-center border-b border-dashed border-border/60 bg-gradient-to-b from-transparent to-muted/20 relative`}>
                    {/* Punch Holes */}
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-background border-r border-t border-border/40" />
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-background border-l border-t border-border/40" />

                    <div className={`w-12 h-12 rounded-full ${statusColor} text-white flex items-center justify-center shadow-md mb-3`}>
                        <StatusIcon className="w-6 h-6" strokeWidth={3} />
                    </div>
                    <h3 className="font-bold text-lg">{title}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1 tracking-wider">REF: {data.id}</p>
                </div>

                {/* Body */}
                <div className="p-6 pt-8 space-y-5 bg-card">

                    {/* Main Info */}
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Service</p>
                            <p className="font-bold text-base leading-tight w-32">{data.serviceName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Amount</p>
                            <p className="font-bold text-base">{data.price}</p>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-2xl border border-border/40">
                        <div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase">Date</span>
                            </div>
                            <p className="text-xs font-semibold">{data.date}</p>
                        </div>
                        <div className="pl-3 border-l border-border/40">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase">Time</span>
                            </div>
                            <p className="text-xs font-semibold">{data.time}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-border/40 mt-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                                <Ticket className="w-3 h-3" />
                                <span className="text-[10px] font-bold uppercase">Guest</span>
                            </div>
                            <p className="text-xs font-semibold">{data.userName} ({data.userPhone})</p>
                        </div>
                    </div>

                    {/* QR Code - Only for Online Payments */}
                    {!isPayAtCounter && (
                        <div className="flex flex-col items-center gap-2 pt-1 pb-2">
                            <QRCode
                                value={JSON.stringify({ id: data.id, status: data.status })}
                                size={100}
                                className="bg-white p-1 rounded-lg border border-border/20"
                            />
                            <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                                {isPaid
                                    ? "Scan to verify ticket"
                                    : "Present at counter to pay"}
                            </p>
                        </div>
                    )}

                    {/* Pay at Counter Instructions */}
                    {isPayAtCounter && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                            <p className="text-xs text-center font-medium text-blue-700 dark:text-blue-300">
                                💵 Please pay {data.price} at the counter
                            </p>
                            <p className="text-[10px] text-center text-muted-foreground mt-1">
                                Arrive 15 minutes early
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions (Outside the screenshot area) */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs h-9 gap-1.5"
                    onClick={handleSaveImage}
                    disabled={isSaving}
                >
                    <Download className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save to Photos"}
                </Button>
                {/* Share - using Navigator Share API if available */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 rounded-xl text-xs h-9 gap-1.5 border border-transparent hover:border-border"
                    onClick={() => {
                        if (navigator.share) {
                            navigator.share({
                                title: `Sahara Receipt - ${data.id}`,
                                text: `Booking confirmed for ${data.serviceName} on ${data.date}`,
                            }).catch(console.error);
                        } else {
                            alert("Sharing not supported on this device/browser");
                        }
                    }}
                >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                </Button>
            </div>
        </div>
    );
}
