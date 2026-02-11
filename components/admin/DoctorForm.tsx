"use client";

import { BookingOption } from "@/lib/chat/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Clock, MapPin, Award } from "lucide-react";

interface ServiceFormProps {
    data: Partial<BookingOption>;
    onChange: (data: Partial<BookingOption>) => void;
}

export function DoctorForm({ data, onChange }: ServiceFormProps) {
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
                        <Label>Doctor Name</Label>
                        <div className="relative">
                            <Stethoscope className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Dr. John Doe"
                                className="pl-9"
                                value={data.title || ""}
                                onChange={e => onChange({ ...data, title: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Specialization (Title)</Label>
                        <Input
                            placeholder="Senior Cardiologist"
                            value={data.subtitle || ""}
                            onChange={e => onChange({ ...data, subtitle: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Hospital / Clinic</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="City Hospital, Room 302"
                            className="pl-9"
                            value={data.details?.hospital || ""}
                            onChange={e => updateDetails("hospital", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Consultation Fee (NPR)</Label>
                        <Input
                            type="number"
                            placeholder="500"
                            value={data.price || ""}
                            onChange={e => onChange({ ...data, price: Number(e.target.value) })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Experience</Label>
                        <div className="relative">
                            <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="10 years"
                                className="pl-9"
                                value={data.details?.experience || ""}
                                onChange={e => updateDetails("experience", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Next Available Slot</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tomorrow 10:00 AM"
                                className="pl-9"
                                value={data.details?.nextSlot || ""}
                                onChange={e => updateDetails("nextSlot", e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Category (Internal)</Label>
                        <Input
                            placeholder="doctor"
                            value={data.category || "doctor"}
                            onChange={e => onChange({ ...data, category: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Specialization Keywords (for Search)</Label>
                    <Input
                        placeholder="kidney, heart, surgery (comma separated)"
                        value={data.details?.specialization || ""}
                        onChange={e => updateDetails("specialization", e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                        Used by AI to find this doctor (e.g. "kidney" matches "Nephrologist")
                    </p>
                </div>
            </div>
        </div>
    );
}
