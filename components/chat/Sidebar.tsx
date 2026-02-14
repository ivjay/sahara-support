"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Settings, HelpCircle, X, Moon, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/lib/chat/chat-context";
import { useState, useEffect } from "react";
import { Logo, LogoCompact } from "@/components/ui/logo";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
}

export function Sidebar({ isOpen, onClose, onNewChat }: SidebarProps) {
    const { state, clearChat, loadSession, deleteSession } = useChatContext();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("sahara_theme");
        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDark(true);
        }
    }, []);

    const toggleDarkMode = () => {
        const isNowDark = document.documentElement.classList.toggle("dark");
        setIsDark(isNowDark);
        localStorage.setItem("sahara_theme", isNowDark ? "dark" : "light");
    };

    const handleNewChat = () => {
        clearChat();
        onNewChat();
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={cn(
                    "h-full bg-background/95 backdrop-blur-sm border-r border-border/50 flex flex-col",
                    "fixed lg:relative inset-y-0 left-0 z-50 w-[280px] lg:w-full",
                    "transition-transform duration-300 ease-in-out",
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-border/50">
                    <LogoCompact />
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            className="h-9 w-9 rounded-lg hover:bg-muted transition-colors"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-9 w-9 rounded-lg hover:bg-muted transition-colors lg:hidden"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <Button
                        onClick={handleNewChat}
                        className="w-full justify-start gap-2.5 h-10 rounded-xl shadow-sm hover:shadow-md transition-all"
                        size="sm"
                    >
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                        <span className="font-medium">New Chat</span>
                    </Button>
                </div>

                {/* Chat History */}
                <ScrollArea className="flex-1 px-3 py-2">
                    {state.messages.length > 0 && (
                        <div className="mb-4">
                            <p className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Current Session
                            </p>
                            <div className="px-3 py-2.5 rounded-lg bg-primary/10 dark:bg-primary/5 border border-primary/20 transition-colors">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-medium text-foreground">Active conversation</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {state.sessions && state.sessions.length > 0 && (
                        <div>
                            <p className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Recent
                            </p>
                            <div className="space-y-1">
                                {state.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSession(session.id)}
                                        className="group relative px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        <p className="text-sm font-medium truncate pr-6">{session.title}</p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{session.preview}</p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSession(session.id);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-background rounded-md transition-all"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {/* Bottom Navigation */}
                <div className="border-t border-border/50 p-3 space-y-1">
                    <Link href="/settings" onClick={onClose}>
                        <Button variant="ghost" className="w-full justify-start gap-2.5 h-10 text-sm rounded-lg" size="sm">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Link href="/help" onClick={onClose}>
                        <Button variant="ghost" className="w-full justify-start gap-2.5 h-10 text-sm rounded-lg" size="sm">
                            <HelpCircle className="h-4 w-4" />
                            Help & Support
                        </Button>
                    </Link>

                    {/* User Profile Card */}
                    <Link href="/profile" onClick={onClose}>
                        <div className="mt-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                    {state.userProfile?.avatarInitials || <User className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{state.userProfile?.name || "Guest User"}</p>
                                    <p className="text-xs text-muted-foreground">{state.userProfile?.accountType || "Free Plan"}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
}