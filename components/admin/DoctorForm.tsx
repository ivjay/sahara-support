"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingOption, STANDARD_DETAILS } from "@/lib/chat/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DoctorFormProps {
    data: Partial<BookingOption>;
    onChange: (data: Partial<BookingOption>) => void;
}

export function DoctorForm({ data, onChange }: DoctorFormProps) {
    const updateField = (field: keyof BookingOption, value: string | number | boolean) => {
        onChange({ ...data, [field]: value });
    };

    const updateDetail = (key: string, value: string) => {
        onChange({
            ...data,
            details: { ...data.details, [key]: value }
        });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Doctor Name *</Label>
                    <Input
                        placeholder="Dr. John Doe"
                        value={data.title || ""}
                        onChange={(e) => updateField("title", e.target.value)}
                    />
                </div>
                <div>
                    <Label>Specialty *</Label>
                    <Select
                        value={data.subtitle || undefined}
                        onValueChange={(value) => {
                            onChange({ ...data, subtitle: value, category: "doctor" });
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="General Physician">General Physician</SelectItem>
                            <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                            <SelectItem value="Dentist">Dentist</SelectItem>
                            <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                            <SelectItem value="Gynecologist">Gynecologist</SelectItem>
                            <SelectItem value="Urologist">Urologist</SelectItem>
                            <SelectItem value="Nephrologist">Nephrologist</SelectItem>
                            <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Hospital/Clinic</Label>
                    <Input
                        placeholder="City Hospital"
                        value={data.details?.hospital || ""}
                        onChange={(e) => updateDetail(STANDARD_DETAILS.hospital, e.target.value)}
                    />
                </div>
                <div>
                    <Label>Experience</Label>
                    <Input
                        placeholder="15 years"
                        value={data.details?.experience || ""}
                        onChange={(e) => updateDetail(STANDARD_DETAILS.experience, e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Next Available Slot</Label>
                    <Input
                        placeholder="Tomorrow 10:00 AM"
                        value={data.details?.nextSlot || ""}
                        onChange={(e) => updateDetail(STANDARD_DETAILS.nextSlot, e.target.value)}
                    />
                </div>
                <div>
                    <Label>Consultation Fee (NPR)</Label>
                    <Input
                        type="number"
                        placeholder="500"
                        value={data.price || ""}
                        onChange={(e) => updateField("price", Number(e.target.value))}
                    />
                </div>
            </div>

            <div>
                <Label>QR Code URL (Optional)</Label>
                <Input
                    placeholder="https://example.com/qr-code.png"
                    value={data.qrCodeUrl || ""}
                    onChange={(e) => updateField("qrCodeUrl", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Provide a direct link to the QR code image for payments.
                </p>
            </div>

            <div>
                <Label>Rating (optional)</Label>
                <Input
                    placeholder="⭐ 4.8"
                    value={data.details?.rating || ""}
                    onChange={(e) => updateDetail(STANDARD_DETAILS.rating, e.target.value)}
                />
            </div>

            <div>
                <Label>Additional Specialization (for search)</Label>
                <Input
                    placeholder="Kidney & Urinary Tract"
                    value={data.details?.specialization || ""}
                    onChange={(e) => updateDetail(STANDARD_DETAILS.specialization, e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                    This helps users find this doctor (e.g., "heart disease", "skin care")
                </p>
            </div>
        </div>
    );
}