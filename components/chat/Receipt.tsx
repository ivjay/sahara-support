"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle2, HeartHandshake, Clock, CreditCard, Wallet, Smartphone, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import html2canvas from "html2canvas";

interface ReceiptProps {
    data: {
        id: string;
        serviceName: string;
        location: string;
        date: string;
        time: string;
        seats?: string;
        passengers?: number;
        price: string;
        status: "Confirmed" | "Pending" | "Under Review" | "Cancelled";
        userName: string;
        userPhone: string;
        timestamp: string;
        paymentMethod?: 'qr' | 'cash';
        qrCodeUrl?: string;
    };
}

export function Receipt({ data }: ReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    const captureReceipt = async (): Promise<Blob | null> => {
        if (!receiptRef.current) return null;
        const canvas = await html2canvas(receiptRef.current, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
            logging: false,
        });
        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
        });
    };

    const handleDownload = async () => {
        setIsSaving(true);
        try {
            const blob = await captureReceipt();
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `sahara-receipt-${data.id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("[Receipt] Download failed:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        setIsSharing(true);
        try {
            const blob = await captureReceipt();
            if (!blob) return;

            const file = new File([blob], `sahara-receipt-${data.id}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `Sahara Booking Receipt - ${data.id}`,
                    text: `Booking: ${data.serviceName}\nDate: ${data.date} ${data.time}\nAmount: ${data.price}`,
                    files: [file],
                });
            } else if (navigator.share) {
                await navigator.share({
                    title: `Sahara Booking Receipt - ${data.id}`,
                    text: `Booking: ${data.serviceName}\nLocation: ${data.location}\nDate: ${data.date} ${data.time}\nAmount: ${data.price}\nStatus: ${data.status}`,
                });
            } else {
                // Fallback: copy receipt text to clipboard
                const text = `Sahara Booking Receipt\nID: ${data.id}\nService: ${data.serviceName}\nLocation: ${data.location}\nDate: ${data.date} ${data.time}\nAmount: ${data.price}\nStatus: ${data.status}\nCustomer: ${data.userName}`;
                await navigator.clipboard.writeText(text);
                alert("Receipt details copied to clipboard!");
            }
        } catch (err: any) {
            if (err?.name !== "AbortError") {
                console.error("[Receipt] Share failed:", err);
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg border-t-4 border-t-primary overflow-hidden">
            <div ref={receiptRef}>
                <div className={`p-6 text-center ${
                    data.status === 'Confirmed' ? 'bg-green-50 dark:bg-green-950/20' :
                    data.status === 'Under Review' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                    'bg-primary/5'
                }`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        data.status === 'Confirmed' ? 'bg-green-100' :
                        data.status === 'Under Review' ? 'bg-yellow-100' :
                        'bg-blue-100'
                    }`}>
                        {data.status === 'Confirmed' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : data.status === 'Under Review' ? (
                            <Clock className="w-6 h-6 text-yellow-600" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {data.status === 'Confirmed' ? 'Booking Confirmed!' :
                         data.status === 'Under Review' ? 'Payment Under Review' :
                         'Booking Received'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Receipt ID: {data.id}</p>
                </div>

                <CardContent className="p-6 space-y-4">
                    {/* Header with Logo */}
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-80">
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                            <HeartHandshake className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Sahara</span>
                    </div>

                    {/* Amount */}
                    <div className="text-center mb-6">
                        <p className="text-sm text-muted-foreground mb-1">
                            {data.paymentMethod === 'cash' ? 'Amount to be Paid' : 'Total Amount Paid'}
                        </p>
                        <p className="text-3xl font-bold text-primary">{data.price}</p>
                    </div>

                    <div className="space-y-4 text-sm">
                        {/* Service Details */}
                        <div className="flex justify-between border-b border-dashed pb-3">
                            <span className="text-muted-foreground">Service</span>
                            <span className="font-medium text-right">{data.serviceName}</span>
                        </div>

                        <div className="flex justify-between border-b border-dashed pb-3">
                            <span className="text-muted-foreground">Provider</span>
                            <span className="font-medium text-right">{data.location}</span>
                        </div>

                        <div className="flex justify-between border-b border-dashed pb-3">
                            <span className="text-muted-foreground">Date & Time</span>
                            <span className="font-medium text-right">
                                {data.date} &bull; {data.time}
                            </span>
                        </div>

                        {/* Seats */}
                        {data.seats && data.seats !== 'N/A' && (
                            <div className="flex justify-between border-b border-dashed pb-3">
                                <span className="text-muted-foreground">Seats</span>
                                <span className="font-medium text-right">{data.seats}</span>
                            </div>
                        )}

                        {/* Passengers */}
                        {data.passengers && (
                            <div className="flex justify-between border-b border-dashed pb-3">
                                <span className="text-muted-foreground">Passengers</span>
                                <span className="font-medium text-right">{data.passengers} {data.passengers === 1 ? 'Person' : 'People'}</span>
                            </div>
                        )}

                        {/* Payment Method */}
                        {data.paymentMethod && (
                            <div className="flex justify-between border-b border-dashed pb-3">
                                <span className="text-muted-foreground">Payment</span>
                                <span className="font-medium text-right flex items-center gap-1.5">
                                    {data.paymentMethod === 'qr' ? (
                                        <>
                                            <CreditCard className="h-3.5 w-3.5 text-primary" />
                                            Online (QR)
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="h-3.5 w-3.5 text-primary" />
                                            Cash on Visit
                                        </>
                                    )}
                                </span>
                            </div>
                        )}

                        {/* Customer Details */}
                        <div className="flex justify-between pt-1">
                            <span className="text-muted-foreground">Customer</span>
                            <span className="font-medium text-right">{data.userName}</span>
                        </div>

                        {/* Phone */}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact</span>
                            <span className="font-medium text-right">{data.userPhone}</span>
                        </div>
                    </div>

                    {/* QR Code for Online Payments */}
                    {data.status === 'Under Review' && data.paymentMethod === 'qr' && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-dashed border-primary/30 shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <Smartphone className="h-5 w-5 text-primary" />
                                <p className="text-sm font-semibold">Complete Payment</p>
                            </div>
                            <div className="w-48 h-48 mx-auto bg-white dark:bg-gray-950 flex items-center justify-center rounded-lg border-2 border-primary/20 shadow-md">
                                {data.qrCodeUrl ? (
                                    <img src={data.qrCodeUrl} alt="QR Code" className="w-full h-full rounded-lg" />
                                ) : (
                                    <div className="text-center p-4">
                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-primary" />
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Scan with eSewa/Khalti</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Amount: {data.price}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500 animate-pulse" />
                                <span>Awaiting payment verification from admin</span>
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="p-3 text-center bg-gray-100 dark:bg-gray-900 text-[10px] text-muted-foreground">
                    Generated via Sahara Support System &bull; {new Date(data.timestamp).toLocaleString()}
                </div>
            </div>

            <Separator />

            <CardFooter className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 border-dashed" onClick={handleDownload} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button className="flex-1 gap-2" onClick={handleShare} disabled={isSharing}>
                    {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    {isSharing ? "Sharing..." : "Share"}
                </Button>
            </CardFooter>
        </Card>
    );
}
