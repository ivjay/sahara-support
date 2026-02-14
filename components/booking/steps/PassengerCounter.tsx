"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus, Users } from "lucide-react";

interface PassengerCounterProps {
    count: number;
    onChange: (count: number) => void;
}

export function PassengerCounter({ count, onChange }: PassengerCounterProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-2">How many passengers?</h3>
            <p className="text-gray-600 mb-8">Select the number of tickets you need</p>

            <div className="flex items-center gap-6">
                <Button
                    variant="outline"
                    size="icon"
                    className="w-14 h-14 rounded-full"
                    onClick={() => onChange(Math.max(1, count - 1))}
                    disabled={count <= 1}
                >
                    <Minus className="w-6 h-6" />
                </Button>

                <div className="text-6xl font-bold w-32 text-center">
                    {count}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="w-14 h-14 rounded-full"
                    onClick={() => onChange(Math.min(10, count + 1))}
                    disabled={count >= 10}
                >
                    <Plus className="w-6 h-6" />
                </Button>
            </div>

            <p className="text-sm text-gray-500 mt-6">Maximum 10 passengers per booking</p>
        </div>
    );
}
