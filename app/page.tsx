"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plane, Bus, Calendar, Film, HeartHandshake, ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10">
                {/* Gradient orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/15 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="max-w-lg w-full text-center relative">
                {/* Badge */}
                <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI-Powered Assistance</span>
                </div>

                {/* Logo */}
                <div className="absolute top-0 right-0 p-4">
                    <Link href="/profile">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer">
                            BA
                        </div>
                    </Link>
                </div>

                <div
                    className={`mb-10 transition-all duration-500 delay-75 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    {/* Icon with glow */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 bg-primary/30 rounded-3xl blur-xl" />
                        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30">
                            <HeartHandshake className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
                        </div>
                    </div>

                    {/* Brand name */}
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">Sahara</h1>
                    <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                        Your intelligent support assistant for bookings and services
                    </p>
                </div>

                {/* Features */}
                <div
                    className={`mb-10 transition-all duration-500 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: Bus, label: "Bus Tickets", color: "from-orange-500/10 to-orange-500/5" },
                            { icon: Plane, label: "Flights", color: "from-blue-500/10 to-blue-500/5" },
                            { icon: Calendar, label: "Appointments", color: "from-green-500/10 to-green-500/5" },
                            { icon: Film, label: "Movies", color: "from-purple-500/10 to-purple-500/5" },
                        ].map(({ icon: Icon, label, color }) => (
                            <div
                                key={label}
                                className={`group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${color} border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer`}
                            >
                                <div className="w-11 h-11 rounded-xl bg-background/80 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-[15px] font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Button */}
                <div
                    className={`transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                >
                    <Link href="/chat">
                        <Button size="lg" className="w-full gap-3 h-14 text-[16px] rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            <MessageSquare className="h-5 w-5" />
                            Start Chatting
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Trust badges */}
                <div
                    className={`flex items-center justify-center gap-6 mt-10 transition-all duration-500 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Always available</span>
                    </div>
                    <div className="text-xs text-muted-foreground">•</div>
                    <div className="text-xs text-muted-foreground">No login required</div>
                    <div className="text-xs text-muted-foreground">•</div>
                    <div className="text-xs text-muted-foreground">Free to use</div>
                </div>
            </div>
        </main>
    );
}