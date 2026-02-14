"use client";

import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/lib/chat/chat-context";

interface QRCodeCardProps {
    option: BookingOption;
}

export function QRCodeCard({ option }: QRCodeCardProps) {
    const { addMessage, setLoading, state } = useChatContext();

    const handlePaid = async () => {
        addMessage("I have paid", "user");
        setLoading(true);

        const { processMessage } = await import("@/lib/chat/agent");

        try {
            const response = await processMessage("I have paid", state.currentBooking);
            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });
        } catch (error) {
            addMessage("Something went wrong verifying payment.", "assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-5 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-900/80 max-w-xs shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl" />

            <div className="relative z-10">
                <h3 className="font-bold text-base mb-1">{option.title}</h3>
                <p className="text-xs text-muted-foreground mb-5">{option.subtitle}</p>

                {/* QR Code Placeholder */}
                <div className="w-full aspect-square bg-white dark:bg-gray-950 border-2 border-primary/20 rounded-xl mb-5 flex items-center justify-center shadow-md p-4">
                    <div className="w-full h-full grid grid-cols-3 gap-1.5">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className={cn(
                                "rounded-md transition-all duration-300 hover:scale-105",
                                [0, 2, 6].includes(i) ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20"
                            )} />
                        ))}
                    </div>
                </div>

                <div className="text-center mb-5 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1.5">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">{option.currency || "NPR"} {option.price || 0}</p>
                </div>

                <Button
                    onClick={handlePaid}
                    className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    I have Paid
                </Button>

                <p className="text-[10px] text-muted-foreground text-center mt-3 opacity-70">
                    Scan with FonePay or eSewa
                </p>
            </div>
        </div>
    );
}