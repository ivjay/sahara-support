"use client";

import { BookingOption } from "@/lib/chat/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Plane, Clock, MapPin } from "lucide-react";

interface ServiceFormProps {
    data: Partial<BookingOption>;
    onChange: (data: Partial<BookingOption>) => void;
    type: "bus" | "flight";
}

export function TransportForm({ data, onChange, type }: ServiceFormProps) {
    const Icon = type === 'bus' ? Bus : Plane;

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
                        <Label>{type === 'bus' ? 'Bus Operator' : 'Airline'}</Label>
                        <div className="relative">
                            <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={type === 'bus' ? "Supar Safe Travels" : "Buddha Air"}
                                className="pl-9"
                                value={data.title || ""}
                                onChange={e => onChange({ ...data, title: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Route (Subtitle)</Label>
                        <Input
                            placeholder="Kathmandu → Pokhara"
                            value={data.subtitle || ""}
                            onChange={e => onChange({ ...data, subtitle: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Departure Time</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="07:00 AM"
                                className="pl-9"
                                value={data.details?.departure || ""}
                                onChange={e => updateDetails("departure", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>{type === 'bus' ? 'Vehicle Type' : 'Aircraft'}</Label>
                        <Input
                            placeholder={type === 'bus' ? "AC Deluxe Sofa" : "ATR 72"}
                            value={(type === 'bus' ? data.details?.busType : data.details?.aircraft) || ""}
                            onChange={e => updateDetails(type === 'bus' ? "busType" : "aircraft", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Price (NPR)</Label>
                        <Input
                            type="number"
                            placeholder="1200"
                            value={data.price || ""}
                            onChange={e => onChange({ ...data, price: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Availability (Seats)</Label>
                        <Input
                            placeholder="15 seats left"
                            value={data.details?.seats || "Available"}
                            onChange={e => updateDetails("seats", e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
