"use client";

import { Card } from "@/components/ui/card";

interface PriceSummaryProps {
    service: any;
    passengerCount: number;
    selectedSeats: string[];
    totalPrice: number;
    selectedDate?: string;
    selectedTime?: string;
}

export function PriceSummary({ service, passengerCount, selectedSeats, totalPrice, selectedDate, selectedTime }: PriceSummaryProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Booking Summary</h3>

            <Card className="p-4">
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Service</span>
                        <span className="font-semibold">{service.title}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-600">Location</span>
                        <span className="text-sm">{service.subtitle}</span>
                    </div>

                    {selectedDate && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date</span>
                            <span className="font-semibold">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}

                    {selectedTime && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Time</span>
                            <span className="font-semibold">{selectedTime}</span>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span className="text-gray-600">Number of Passengers</span>
                        <span className="font-semibold">{passengerCount}</span>
                    </div>

                    {selectedSeats.length > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Selected Seats</span>
                            <span className="font-semibold">{selectedSeats.join(', ')}</span>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span className="text-gray-600">Base Price</span>
                        <span>NPR {service.price} × {passengerCount}</span>
                    </div>

                    <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total Amount</span>
                            <span className="text-primary">NPR {totalPrice}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
