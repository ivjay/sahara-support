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
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-w-xs">
            <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{option.subtitle}</p>

            {/* QR Code Placeholder */}
            <div className="w-full aspect-square bg-white border border-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-32 h-32 grid grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className={cn(
                            "rounded-sm",
                            [0, 2, 6].includes(i) ? "bg-black" : "bg-black/20"
                        )} />
                    ))}
                </div>
            </div>

            <div className="text-center mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Total Amount</p>
                <p className="text-lg font-bold">{option.currency || "NPR"} {option.price || 0}</p>
            </div>

            <Button onClick={handlePaid} className="w-full">
                I have Paid
            </Button>

            <p className="text-[10px] text-gray-500 text-center mt-3">
                Scan with FonePay or eSewa
            </p>
        </div>
    );
}