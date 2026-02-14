"use client";

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PassengerInfo } from "@/lib/booking/types";
import { User } from "lucide-react";

interface PassengerDetailsProps {
    passengers: PassengerInfo[];
    onChange: (index: number, info: PassengerInfo) => void;
    userProfile?: {
        name?: string;
        phone?: string;
        email?: string;
    };
}

export function PassengerDetails({ passengers, onChange, userProfile }: PassengerDetailsProps) {
    // Auto-fill first passenger with user profile data
    useEffect(() => {
        if (userProfile && passengers.length > 0 && !passengers[0].fullName) {
            onChange(0, {
                ...passengers[0],
                fullName: userProfile.name || '',
                phone: userProfile.phone || '',
                email: userProfile.email || ''
            });
        }
    }, [userProfile]);
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Enter Passenger Details</h3>

            {passengers.map((passenger, index) => (
                <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-primary" />
                        <span className="font-semibold">Passenger {index + 1}</span>
                        {index === 0 && <span className="text-xs text-gray-500">(Primary Contact)</span>}
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label>Full Name *</Label>
                            <Input
                                placeholder="Enter full name"
                                value={passenger.fullName}
                                onChange={(e) => onChange(index, { ...passenger, fullName: e.target.value })}
                            />
                        </div>

                        {index === 0 && (
                            <>
                                <div>
                                    <Label>Phone Number *</Label>
                                    <Input
                                        type="tel"
                                        placeholder="Enter phone number"
                                        value={passenger.phone || ''}
                                        onChange={(e) => onChange(index, { ...passenger, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        placeholder="Enter email address"
                                        value={passenger.email || ''}
                                        onChange={(e) => onChange(index, { ...passenger, email: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
