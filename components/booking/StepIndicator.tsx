"use client";

import { BookingStep } from "@/lib/booking/types";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
    steps: { id: BookingStep; label: string }[];
    currentStep: BookingStep;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isComplete = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                        isComplete && "bg-green-500 border-green-500 text-white",
                                        isCurrent && "bg-primary border-primary text-white scale-110",
                                        !isComplete && !isCurrent && "bg-gray-200 border-gray-300 text-gray-500"
                                    )}
                                >
                                    {isComplete ? <Check className="w-5 h-5" /> : index + 1}
                                </div>
                                <span className={cn(
                                    "text-xs mt-2 text-center",
                                    isCurrent && "font-bold text-primary",
                                    !isCurrent && "text-gray-500"
                                )}>
                                    {step.label}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div className={cn(
                                    "flex-1 h-1 mx-2",
                                    isComplete ? "bg-green-500" : "bg-gray-200"
                                )} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
