"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    HeartHandshake,
    MessageSquare,
    Plus,
    Settings,
    HelpCircle,
    ChevronLeft,
    User,
    MoreHorizontal,
    Moon,
    Sun,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/lib/chat/chat-context";
import { useState, useEffect } from "react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
}

export function Sidebar({ isOpen, onClose, onNewChat }: SidebarProps) {
    const { state, clearChat } = useChatContext();
    const [isDark, setIsDark] = useState(false);
    const [isLogoHovered, setIsLogoHovered] = useState(false);

    useEffect(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    const toggleDarkMode = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    const handleNewChat = () => {
        clearChat();
        onNewChat();
    };

    const hasActiveChat = state.messages.length > 0;

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    // Base styles
                    "h-full bg-background border-r border-border flex flex-col",
                    // Mobile: fixed, slide from left
                    "fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-full",
                    "transition-transform duration-300 ease-out",
                    // Mobile visibility
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
                    <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onMouseEnter={() => setIsLogoHovered(true)}
                        onMouseLeave={() => setIsLogoHovered(false)}
                    >
                        <div className={cn(
                            "w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-all duration-300",
                            isLogoHovered && "scale-110 shadow-lg shadow-primary/30"
                        )}>
                            <HeartHandshake
                                className={cn(
                                    "w-5 h-5 text-primary-foreground transition-transform",
                                    isLogoHovered && "animate-heartbeat"
                                )}
                                strokeWidth={1.5}
                            />
                        </div>
                        <div>
                            <h2 className={cn(
                                "font-bold text-[15px] leading-tight transition-colors",
                                isLogoHovered && "text-primary"
                            )}>Sahara</h2>
                            <p className="text-[10px] text-muted-foreground">AI Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            className="h-8 w-8 hover:scale-110 transition-transform"
                        >
                            {isDark ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                        </Button>
                        {/* Close button for mobile */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 lg:hidden"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-3 shrink-0">
                    <Button
                        onClick={handleNewChat}
                        className="w-full gap-2 h-10 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                        variant="default"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New chat</span>
                    </Button>
                </div>

                {/* Chat History Area - Scrollable */}
                <ScrollArea className="flex-1 px-3">
                    {hasActiveChat ? (
                        <div className="space-y-1 animate-fade-in-up">
                            <p className="px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Current Chat
                            </p>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover-lift cursor-pointer">
                                <MessageSquare className="h-4 w-4 shrink-0" />
                                <span className="text-[13px] truncate flex-1 font-medium">
                                    {state.currentBooking ? "Booking in progress" : "New conversation"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                                <MessageSquare className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">No chats yet</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Start a new conversation</p>
                        </div>
                    )}
                </ScrollArea>

                {/* Bottom Navigation - Fixed at bottom */}
                <div className="border-t border-border shrink-0">
                    <div className="p-2 space-y-0.5">
                        <Link href="/settings" className="block" onClick={onClose}>
                            <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-[13px] font-normal hover:translate-x-1 transition-transform">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                        <Link href="/help" className="block" onClick={onClose}>
                            <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-[13px] font-normal hover:translate-x-1 transition-transform">
                                <HelpCircle className="h-4 w-4" />
                                Help & Support
                            </Button>
                        </Link>
                    </div>

                    {/* User Profile */}
                    <div className="p-3 pt-0">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-all hover-lift cursor-pointer">
                            <Avatar className="h-9 w-9 bg-primary flex items-center justify-center">
                                <User className="h-4 w-4 text-primary-foreground" />
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">Demo User</p>
                                <p className="text-[10px] text-muted-foreground">Free Plan</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:rotate-90 transition-transform">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
