"use client";

import { BookingOption } from "@/lib/chat/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, Video, Calendar, ImageIcon } from "lucide-react";
import { useState } from "react";

interface ServiceFormProps {
    data: Partial<BookingOption>;
    onChange: (data: Partial<BookingOption>) => void;
}

export function MovieForm({ data, onChange }: ServiceFormProps) {
    const [imagePreviewError, setImagePreviewError] = useState(false);

    const updateDetails = (key: string, value: string) => {
        onChange({
            ...data,
            details: { ...data.details, [key]: value }
        });
    };

    const posterUrl = data.details?.imageUrl || "";

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

                {/* Movie Poster Image */}
                <div className="space-y-2">
                    <Label>Movie Poster URL</Label>
                    <div className="relative">
                        <ImageIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="https://example.com/movie-poster.jpg"
                            className="pl-9"
                            value={posterUrl}
                            onChange={e => {
                                setImagePreviewError(false);
                                updateDetails("imageUrl", e.target.value);
                            }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Paste a direct link to the movie poster image
                    </p>
                    {posterUrl && !imagePreviewError && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-muted/30 w-32 h-44 relative">
                            <img
                                src={posterUrl}
                                alt="Movie poster preview"
                                className="w-full h-full object-cover"
                                onError={() => setImagePreviewError(true)}
                            />
                        </div>
                    )}
                    {imagePreviewError && posterUrl && (
                        <p className="text-xs text-destructive">Could not load image preview. Check the URL.</p>
                    )}
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
                            placeholder="4.5"
                            value={data.details?.rating || ""}
                            onChange={e => updateDetails("rating", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
