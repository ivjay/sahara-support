"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plane, Bus, Calendar, Film, ArrowRight, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo, LogoIcon } from "@/components/ui/logo";

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-dvh flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {/* Vibrant animated background */}
            <div className="absolute inset-0 -z-10">
                {/* Large animated gradient orbs */}
                <div className="absolute top-20 -left-20 w-[800px] h-[800px] bg-gradient-to-br from-primary/30 via-chart-2/20 to-chart-3/10 dark:from-primary/20 dark:via-chart-2/15 dark:to-chart-3/5 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-20 -right-20 w-[900px] h-[900px] bg-gradient-to-tl from-chart-3/30 via-primary/20 to-chart-2/10 dark:from-chart-3/20 dark:via-primary/15 dark:to-chart-2/5 rounded-full blur-[150px] float-smooth" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-accent/20 to-primary/15 dark:from-accent/10 dark:to-primary/10 rounded-full blur-[120px]" />

                {/* Animated gradient mesh overlay */}
                <div
                    className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 20% 50%, oklch(0.75 0.20 260 / 0.4) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, oklch(0.70 0.22 280 / 0.4) 0%, transparent 50%),
                            radial-gradient(circle at 40% 20%, oklch(0.65 0.24 300 / 0.4) 0%, transparent 50%)
                        `,
                    }}
                />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
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

                {/* Profile Badge */}
                <div className="absolute top-0 right-0 p-4">
                    <Link href="/profile">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all cursor-pointer">
                            <User className="h-5 w-5" />
                        </div>
                    </Link>
                </div>

                <div
                    className={`mb-12 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    {/* Vibrant logo with animated glow */}
                    <div className="relative w-40 h-40 mx-auto mb-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-chart-2/30 to-chart-3/20 rounded-full blur-3xl animate-pulse neon-glow" style={{ animationDuration: '6s' }} />
                        <div className="absolute inset-0 bg-gradient-to-tl from-chart-3/30 via-primary/20 to-chart-2/15 rounded-full blur-2xl float-smooth" />
                        <div className="relative">
                            <Logo size="lg" showText={false} className="mx-auto scale-125" />
                        </div>
                    </div>

                    {/* Bold brand name with gradient */}
                    <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tight text-gradient-vibrant drop-shadow-lg">
                        Sahara
                    </h1>
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-primary/10 via-chart-2/10 to-chart-3/10 border-2 border-primary/20 shadow-lg mb-6">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-sm text-foreground uppercase tracking-[0.25em] font-bold">
                            AI-Powered Support
                        </p>
                    </div>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                        Book anything, anytime — from flights to doctors, movies to buses.
                        <br />
                        <span className="text-gradient-vibrant font-bold">All in one intelligent conversation.</span>
                    </p>
                </div>

                {/* Feature Cards - Vibrant */}
                <div
                    className={`mb-12 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {[
                            { icon: Bus, label: "Bus Tickets", gradient: "from-orange-500/20 via-orange-400/10 to-amber-500/5", glow: "group-hover:shadow-orange-500/30" },
                            { icon: Plane, label: "Flights", gradient: "from-blue-500/20 via-blue-400/10 to-cyan-500/5", glow: "group-hover:shadow-blue-500/30" },
                            { icon: Calendar, label: "Appointments", gradient: "from-green-500/20 via-emerald-400/10 to-teal-500/5", glow: "group-hover:shadow-green-500/30" },
                            { icon: Film, label: "Movies", gradient: "from-purple-500/20 via-purple-400/10 to-pink-500/5", glow: "group-hover:shadow-purple-500/30" },
                        ].map(({ icon: Icon, label, gradient, glow }, index) => (
                            <div
                                key={label}
                                className={`group relative flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${gradient} border-2 border-border/30 hover:border-primary/50 shadow-lg hover:shadow-2xl ${glow} hover:-translate-y-1 transition-all duration-300 cursor-pointer card-lift overflow-hidden`}
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 shimmer-vibrant opacity-0 group-hover:opacity-100" />

                                <div className="relative w-12 h-12 rounded-xl bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-primary/20">
                                    <Icon className="h-6 w-6 text-primary" strokeWidth={2.5} />
                                </div>
                                <span className="relative text-base font-bold">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bold CTA Button */}
                <div
                    className={`transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                >
                    <Link href="/chat">
                        <div className="relative max-w-md mx-auto group">
                            {/* Animated gradient border */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse" style={{ animationDuration: '3s' }} />

                            <Button
                                size="lg"
                                className="relative w-full gap-3 h-16 text-lg font-bold rounded-3xl bg-gradient-to-r from-primary via-chart-2 to-chart-3 hover:from-chart-2 hover:via-chart-3 hover:to-primary shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 neon-glow"
                            >
                                <MessageSquare className="h-6 w-6" strokeWidth={2.5} />
                                <span>Start Chatting Now</span>
                                <ArrowRight className="h-6 w-6" strokeWidth={2.5} />

                                {/* Shimmer effect */}
                                <div className="absolute inset-0 shimmer-vibrant rounded-3xl" />
                            </Button>
                        </div>
                    </Link>
                </div>

                {/* Trust badges - Enhanced */}
                <div
                    className={`flex flex-wrap items-center justify-center gap-4 mt-12 transition-all duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}
                >
                    {[
                        { label: "24/7 Available", color: "from-green-500 to-emerald-500" },
                        { label: "No Login Required", color: "from-blue-500 to-cyan-500" },
                        { label: "100% Free", color: "from-purple-500 to-pink-500" }
                    ].map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm shadow-md">
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${color} animate-pulse shadow-lg`} />
                            <span className="text-sm font-semibold">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}