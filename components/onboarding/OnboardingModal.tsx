"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    HeartHandshake,
    Bus,
    CheckCircle2,
    ArrowRight
} from "lucide-react";
import { CURRENT_USER } from "@/lib/user-context";

const STORAGE_KEY = "sahara_has_onboarded_v1";

const STEPS = [
    {
        title: "Namaste! 🙏",
        description: "I'm Sahara, your personal support assistant. I'm here to help you get things done in Nepal.",
        icon: HeartHandshake,
        color: "text-primary bg-primary/10"
    },
    {
        title: "I can help you book...",
        description: "Bus tickets, domestic flights, movie tickets, and even doctor appointments.",
        icon: Bus,
        color: "text-orange-600 bg-orange-500/10"
    },
    {
        title: "Personalized for you",
        description: "I remember your preferences and details so you don't have to repeat them.",
        icon: CheckCircle2,
        color: "text-green-600 bg-green-500/10"
    }
];

export function OnboardingModal() {
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check if user has seen onboarding
        const hasOnboarded = localStorage.getItem(STORAGE_KEY);
        if (!hasOnboarded) {
            // Small delay for entrance animation
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setOpen(false);
        localStorage.setItem(STORAGE_KEY, "true");
    };

    if (!open) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === STEPS.length - 1;
    const title = currentStep === 0
        ? `Namaste, ${CURRENT_USER.firstName}! 🙏`
        : step.title;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500" />

            {/* Content - Bottom Sheet on Mobile, Modal on Desktop */}
            <div className="relative w-full max-w-sm bg-background border border-border/50 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500 sm:zoom-in-95 data-[state=open]:bounce-in">

                {/* Decorative background blob */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                <div className="p-8 flex flex-col items-center text-center space-y-6 relative">

                    {/* Step Icon */}
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${step.color} transition-all duration-500 shadow-sm border border-border/50`}>
                            <Icon className="w-10 h-10" />
                        </div>
                        {isLastStep && (
                            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="space-y-2 min-h-[100px]">
                        <h2 className="text-2xl font-bold tracking-tight animate-in slide-in-from-bottom-2 fade-in duration-300 key={currentStep}">
                            {title}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed animate-in slide-in-from-bottom-1 fade-in duration-300 delay-100 key={currentStep + 'desc'}">
                            {step.description}
                        </p>
                    </div>

                    {/* Indicators */}
                    <div className="flex gap-2 justify-center pt-2">
                        {STEPS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? "w-8 bg-primary" : "w-2 bg-muted/60"
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Action Button */}
                    <Button
                        className="w-full h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]"
                        size="lg"
                        onClick={handleNext}
                    >
                        {isLastStep ? "Get Started" : "Continue"}
                        {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
