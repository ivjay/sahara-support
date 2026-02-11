"use client";

import { OptionCard } from "@/components/chat/OptionCard";
import { BookingOption } from "@/lib/chat/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface LivePreviewProps {
    data: Partial<BookingOption>;
}

export function LivePreview({ data }: LivePreviewProps) {
    // Create a preview object with defaults
    const previewOption: BookingOption = {
        id: "preview",
        type: data.type || "appointment",
        title: data.title || "Service Title",
        subtitle: data.subtitle || "Service Subtitle / Location",
        price: data.price || 0,
        currency: data.currency || "NPR",
        available: true,
        details: data.details || {},
        category: data.category
    };

    return (
        <Card className="p-6 h-full flex flex-col bg-muted/30 backdrop-blur-sm border-dashed">
            <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium uppercase tracking-wider">Live Preview</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="w-full max-w-sm transform transition-all duration-300 hover:scale-105">
                    <OptionCard
                        option={previewOption}
                        onSelect={() => { }}
                    />
                </div>

                <div className="text-center space-y-2">
                    <Badge variant="outline" className="bg-background/50">
                        Type: {previewOption.type}
                    </Badge>
                    {previewOption.type === 'bus' && (
                        <p className="text-xs text-muted-foreground">
                            Shows as "Bus" in chat
                        </p>
                    )}
                    {previewOption.type === 'appointment' && (
                        <p className="text-xs text-muted-foreground">
                            Shows as "Doctor/Service" in chat
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
