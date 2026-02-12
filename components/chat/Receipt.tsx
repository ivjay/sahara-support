"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, CheckCircle2, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ReceiptProps {
    data: {
        id: string;
        serviceName: string;
        location: string;
        date: string;
        time: string;
        price: string;
        status: "Confirmed" | "Pending" | "Cancelled";
        userName: string;
        userPhone: string;
        timestamp: string;
    };
}

export function Receipt({ data }: ReceiptProps) {
    const handleDownload = () => {
        alert("Downloading receipt... (Mock)");
    };

    return (
        <Card className="w-full max-w-sm mx-auto shadow-lg border-t-4 border-t-primary overflow-hidden">
            <div className="bg-primary/5 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Booking Confirmed!</h2>
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
                    <p className="text-sm text-muted-foreground mb-1">Total Amount Paid</p>
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
                            {data.date} • {data.time}
                        </span>
                    </div>

                    {/* Customer Details */}
                    <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground">Customer</span>
                        <span className="font-medium text-right">{data.userName}</span>
                    </div>
                </div>
            </CardContent>

            <Separator />

            <CardFooter className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 border-dashed" onClick={handleDownload}>
                    <Download className="w-4 h-4" />
                    Save
                </Button>
                <Button className="flex-1 gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                </Button>
            </CardFooter>

            <div className="p-3 text-center bg-gray-100 dark:bg-gray-900 text-[10px] text-muted-foreground">
                Generated via Sahara Support System • {new Date(data.timestamp).toLocaleString()}
            </div>
        </Card>
    );
}
