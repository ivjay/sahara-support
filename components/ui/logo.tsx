"use client";

import { cn } from "@/lib/utils";
import { HeartHandshake } from "lucide-react";

interface LogoProps {
    size?: "sm" | "md" | "lg";
    showText?: boolean;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
}

export function Logo({
    size = "md",
    showText = true,
    className,
    iconClassName,
    textClassName
}: LogoProps) {
    const sizes = {
        sm: {
            container: "w-7 h-7",
            icon: "w-4 h-4",
            text: "text-sm"
        },
        md: {
            container: "w-10 h-10",
            icon: "w-5 w-5",
            text: "text-lg"
        },
        lg: {
            container: "w-16 h-16",
            icon: "w-8 h-8",
            text: "text-2xl"
        }
    };

    const { container, icon, text } = sizes[size];

    return (
        <div className={cn("flex items-center gap-2.5", className)}>
            {/* Logo Icon with gradient */}
            <div className={cn(
                "rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 relative overflow-hidden group transition-transform hover:scale-105",
                container,
                iconClassName
            )}>
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Icon */}
                <HeartHandshake
                    className={cn("text-white relative z-10", icon)}
                    strokeWidth={2}
                />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-2 h-2 bg-white/30 rounded-bl-lg" />
            </div>

            {/* Logo Text */}
            {showText && (
                <div className="flex flex-col leading-none">
                    <span className={cn(
                        "font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent",
                        text,
                        textClassName
                    )}>
                        Sahara
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                        AI Support
                    </span>
                </div>
            )}
        </div>
    );
}

// Compact version for mobile
export function LogoCompact({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-md">
                <HeartHandshake className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-base tracking-tight">Sahara</span>
        </div>
    );
}

// Icon only version
export function LogoIcon({
    size = "md",
    className
}: {
    size?: "sm" | "md" | "lg",
    className?: string
}) {
    const sizes = {
        sm: "w-7 h-7",
        md: "w-10 h-10",
        lg: "w-16 h-16"
    };

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-8 h-8"
    };

    return (
        <div className={cn(
            "rounded-xl bg-gradient-to-br from-primary via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 relative overflow-hidden group transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30",
            sizes[size],
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <HeartHandshake
                className={cn("text-white relative z-10", iconSizes[size])}
                strokeWidth={2}
            />
            <div className="absolute top-0 right-0 w-2 h-2 bg-white/30 rounded-bl-lg" />
        </div>
    );
}
