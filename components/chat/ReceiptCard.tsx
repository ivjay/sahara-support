"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";

interface ReceiptCardProps {
    data: {
        id: string;
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
}

export function ReceiptCard({ data }: ReceiptCardProps) {
    const isPaid = data.status === "Confirmed";
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const captureReceipt = async (): Promise<Blob | null> => {
        if (!receiptRef.current) {
            console.error("[ReceiptCard] Receipt element not found");
            return null;
        }

        try {
            console.log("[ReceiptCard] Capturing receipt...");
            const canvas = await html2canvas(receiptRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true,
            });

            return new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        console.log("[ReceiptCard] ✓ Receipt captured successfully");
                        resolve(blob);
                    } else {
                        console.error("[ReceiptCard] Failed to create blob");
                        reject(new Error("Failed to create image blob"));
                    }
                }, "image/png", 1.0);
            });
        } catch (error) {
            console.error("[ReceiptCard] html2canvas error:", error);
            return null;
        }
    };

    const handleDownload = async () => {
        setIsSaving(true);
        try {
            console.log("[ReceiptCard] Starting download...");
            const blob = await captureReceipt();

            if (!blob) {
                console.error("[ReceiptCard] Blob is null");
                alert("❌ Failed to capture receipt. Please try again or take a screenshot.");
                setIsSaving(false);
                return;
            }

            console.log("[ReceiptCard] Blob created, size:", blob.size);

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `sahara-receipt-${data.id}.png`;

            // Force download by clicking the link
            document.body.appendChild(link);
            console.log("[ReceiptCard] Triggering download...");
            link.click();

            // Cleanup after a short delay to ensure download started
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log("✅ Receipt download triggered successfully!");
            }, 100);

        } catch (err) {
            console.error("[ReceiptCard] Download failed:", err);
            alert("❌ Download failed. Please try again or take a screenshot.");
        } finally {
            // Set saving to false after a brief delay
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            // Try Web Share API first (works on mobile)
            if (navigator.share) {
                const blob = await captureReceipt();

                // Try sharing with image file if supported
                if (blob && navigator.canShare?.({ files: [new File([blob], "receipt.png", { type: "image/png" })] })) {
                    const file = new File([blob], `sahara-receipt-${data.id}.png`, { type: "image/png" });
                    await navigator.share({
                        title: `Sahara Booking Receipt - ${data.id}`,
                        text: `Booking: ${data.serviceName}\nDate: ${data.date} ${data.time}\nAmount: ${data.price}`,
                        files: [file],
                    });
                    console.log("✅ Receipt shared with image!");
                    setIsSharing(false);
                    return;
                }

                // Fallback to text-only share
                await navigator.share({
                    title: `Sahara Booking Receipt - ${data.id}`,
                    text: `🎫 Sahara Booking Receipt\n\n📋 ID: ${data.id}\n🏢 Service: ${data.serviceName}\n📍 Location: ${data.location}\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n💰 Amount: ${data.price}\n✅ Status: ${data.status}\n👤 Customer: ${data.userName}\n📞 Contact: ${data.userPhone}`,
                });
                console.log("✅ Receipt shared as text!");
                setIsSharing(false);
                return;
            }

            // Fallback: Copy to clipboard
            const text = `🎫 Sahara Booking Receipt\n\n📋 Booking ID: ${data.id}\n🏢 Service: ${data.serviceName}\n📍 Location: ${data.location}\n📅 Date: ${data.date}\n🕐 Time: ${data.time}\n💰 Amount: ${data.price}\n✅ Status: ${data.status}\n👤 Customer: ${data.userName}\n📞 Contact: ${data.userPhone}\n\n🌐 Generated via Sahara Support System`;
            await navigator.clipboard.writeText(text);
            alert("✅ Receipt details copied to clipboard!\n\nYou can now paste it in any app.");
            console.log("✅ Receipt copied to clipboard!");
        } catch (err: any) {
            if (err?.name === "AbortError") {
                console.log("ℹ️ User cancelled share");
            } else {
                console.error("[ReceiptCard] Share failed:", err);
                alert("❌ Share failed. Please try taking a screenshot instead.");
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="max-w-sm mt-3 space-y-2">
            <div ref={receiptRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-dashed border-gray-200 dark:border-gray-700">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium mb-2",
                        isPaid
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                    )}>
                        {isPaid ? "Confirmed" : "Pending Payment"}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">REF: {data.id}</p>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-semibold text-lg leading-tight">{data.serviceName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {data.location}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mb-1">
                                <Calendar className="w-3 h-3" />
                                Date
                            </p>
                            <p className="font-medium">{data.date}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" />
                                Time
                            </p>
                            <p className="font-medium">{data.time}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                        <span className="text-lg font-bold">{data.price}</span>
                    </div>

                    {/* QR Code - Only for paid */}
                    {isPaid && (
                        <div className="flex justify-center py-2">
                            <div className="bg-white p-2 rounded-lg">
                                <QRCode
                                    value={JSON.stringify({ id: data.id, status: data.status })}
                                    size={80}
                                />
                            </div>
                        </div>
                    )}

                    {/* Pay at counter notice */}
                    {!isPaid && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                            <p className="text-xs text-center font-medium text-blue-800 dark:text-blue-300">
                                Pay {data.price} at the counter
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={handleDownload} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={handleShare} disabled={isSharing}>
                    {isSharing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Share2 className="w-3 h-3 mr-1" />}
                    {isSharing ? "Sharing..." : "Share"}
                </Button>
            </div>
        </div>
    );
}
