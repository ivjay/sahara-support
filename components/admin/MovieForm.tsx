"use client";

import { BookingOption } from "@/lib/chat/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Video, Calendar } from "lucide-react";

interface ServiceFormProps {
    data: Partial<BookingOption>;
    onChange: (data: Partial<BookingOption>) => void;
}

export function MovieForm({ data, onChange }: ServiceFormProps) {
    const updateDetails = (key: string, value: string) => {
        onChange({
            ...data,
            details: { ...data.details, [key]: value }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Movie Title</Label>
                        <div className="relative">
                            <Film className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Kabaddi 4"
                                className="pl-9"
                                value={data.title || ""}
                                onChange={e => onChange({ ...data, title: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Cinema Hall</Label>
                        <Input
                            placeholder="QFX, Civil Mall"
                            value={data.subtitle || ""}
                            onChange={e => onChange({ ...data, subtitle: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Showtime</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="4:30 PM"
                                className="pl-9"
                                value={data.details?.showtime || ""}
                                onChange={e => updateDetails("showtime", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Format / Language</Label>
                        <div className="relative">
                            <Video className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="3D / Nepali"
                                className="pl-9"
                                value={data.details?.format || ""}
                                onChange={e => updateDetails("format", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Price (NPR)</Label>
                        <Input
                            type="number"
                            placeholder="450"
                            value={data.price || ""}
                            onChange={e => onChange({ ...data, price: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Rating</Label>
                        <Input
                            placeholder="⭐ 4.5"
                            value={data.details?.rating || ""}
                            onChange={e => updateDetails("rating", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
