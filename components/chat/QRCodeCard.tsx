"use client";

import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QrCode, CheckCircle2 } from "lucide-react";
import { useChatContext } from "@/lib/chat/chat-context";
import { useState } from "react";

interface QRCodeCardProps {
    option: BookingOption;
}

export function QRCodeCard({ option }: QRCodeCardProps) {
    const { addMessage, setLoading, state } = useChatContext();
    const [isPaid, setIsPaid] = useState(false);

    const handlePaid = async () => {
        setIsPaid(true);
        addMessage("I have paid", "user");
        setLoading(true);

        const { processMessage } = await import("@/lib/chat/agent");

        try {
            // Process the "I have paid" message
            // This will hit the interception logic in usage of processMessage if step matches
            const response = await processMessage("I have paid", state.currentBooking);

            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });

            // If response completes the booking, the Page component will handle the modal via state change
        } catch (error) {
            console.error("Payment confirmation failed", error);
            addMessage("Something went wrong verifying payment.", "assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm max-w-xs mx-auto animate-pop-in">
            <div className="text-center space-y-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                </div>

                {/* QR Visualization */}
                <div className="relative w-48 h-48 mx-auto bg-white p-2 rounded-xl border-2 border-primary/20 shadow-inner flex items-center justify-center group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-lg" />

                    {/* QR Placeholder using SVG */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-black group-hover:scale-105 transition-transform duration-300">
                        <path fill="currentColor" d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z" />
                        <path fill="currentColor" d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z" />
                        <path fill="currentColor" d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z" />
                        <rect x="25" y="25" width="10" height="10" fill="currentColor" />
                        <rect x="75" y="25" width="10" height="10" fill="currentColor" />
                        <rect x="25" y="75" width="10" height="10" fill="currentColor" />

                        <rect x="50" y="10" width="10" height="10" fill="currentColor" opacity="0.8" />
                        <rect x="10" y="50" width="10" height="10" fill="currentColor" opacity="0.6" />
                        <rect x="50" y="50" width="30" height="30" fill="currentColor" opacity="0.9" />
                        <path d="M45,45 h10 v10 h-10 z" fill="currentColor" />
                        <path d="M60,60 h5 v5 h-5 z" fill="currentColor" />
                    </svg>

                    {/* Center Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-lg border border-border">
                            <QrCode className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-primary">
                        {option.details?.price || option.price ? `NPR ${option.price || 500}` : "NPR 1,500.00"}
                    </p>
                </div>

                <Button
                    className={cn("w-full gap-2", isPaid && "bg-green-500 hover:bg-green-600 border-green-600")}
                    onClick={handlePaid}
                    disabled={isPaid}
                >
                    {isPaid ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Verifying...
                        </>
                    ) : (
                        "I have Paid"
                    )}
                </Button>

                <p className="text-[10px] text-muted-foreground">
                    Secure payment via FonePay / Nepal Pay
                </p>
            </div>
        </div>
    );
}
