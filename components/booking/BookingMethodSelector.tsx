"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wand2, X, CheckCircle, Zap, Calendar, CreditCard } from "lucide-react";

interface BookingMethodSelectorProps {
    serviceName: string;
    serviceType: string;
    onSelectChat: () => void;
    onSelectWizard: () => void;
    onCancel: () => void;
}

export function BookingMethodSelector({
    serviceName,
    serviceType,
    onSelectChat,
    onSelectWizard,
    onCancel
}: BookingMethodSelectorProps) {
    const features = {
        chat: [
            { icon: MessageSquare, text: "Natural conversation" },
            { icon: Zap, text: "Quick and simple" },
            { icon: CheckCircle, text: "Guided step-by-step" }
        ],
        wizard: [
            { icon: Calendar, text: "Visual seat selection" },
            { icon: Wand2, text: "See all options at once" },
            { icon: CreditCard, text: "Faster for multiple bookings" }
        ]
    };

    const handleSelectChat = () => {
        onSelectChat();
    };

    const handleSelectWizard = () => {
        onSelectWizard();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="max-w-3xl w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <Card className="p-6 relative shadow-2xl">
                        {/* Close Button */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold mb-2">
                                How would you like to book?
                            </h2>
                            <p className="text-gray-600">
                                Booking <span className="font-semibold text-primary">{serviceName}</span>
                            </p>
                        </div>

                        {/* Options Grid */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Chat Option */}
                            <div className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                <Card
                                    onClick={handleSelectChat}
                                    className="p-6 cursor-pointer transition-all border-2 border-gray-200 hover:border-primary hover:shadow-lg hover:bg-primary/5"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-gray-100 hover:bg-primary hover:text-white transition-colors">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">Chat with Me</h3>
                                            <p className="text-sm text-gray-600">
                                                I'll guide you through questions
                                            </p>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2 mt-4">
                                        {features.chat.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <feature.icon className="w-4 h-4 text-primary" />
                                                <span className="text-gray-700">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-start gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                                                S
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-600 italic">
                                                    "When would you like to visit?"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Wizard Option */}
                            <div className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                                <Card
                                    onClick={handleSelectWizard}
                                    className="p-6 cursor-pointer transition-all border-2 border-gray-200 hover:border-primary hover:shadow-lg hover:bg-primary/5"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-gray-100 hover:bg-primary hover:text-white transition-colors">
                                            <Wand2 className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1">
                                                Smart Wizard
                                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    Recommended
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Visual form with live seat map
                                            </p>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-2 mt-4">
                                        {features.wizard.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <feature.icon className="w-4 h-4 text-primary" />
                                                <span className="text-gray-700">{feature.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-4 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                                        <div className="grid grid-cols-5 gap-1">
                                            {[...Array(15)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`aspect-square rounded ${
                                                        i === 7
                                                            ? 'bg-primary'
                                                            : i % 3 === 0
                                                            ? 'bg-gray-300'
                                                            : 'bg-gray-100'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-600 text-center mt-2">
                                            Live seat selection preview
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Helper Text */}
                        <p className="text-center text-sm text-gray-600 mt-4">
                            💡 Click any option to proceed • You can switch between methods anytime
                        </p>
                    </Card>
            </div>
        </div>
    );
}
