"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Settings, HelpCircle, X, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/lib/chat/chat-context";
import { useState, useEffect } from "react";

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
                    "h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col",
                    "fixed lg:relative inset-y-0 left-0 z-50 w-[260px] lg:w-full",
                    "transition-transform duration-200",
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="h-14 px-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                    <h2 className="font-semibold text-sm">Sahara</h2>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleDarkMode}
                            className="h-8 w-8"
                        >
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
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

                {/* New Chat */}
                <div className="p-2">
                    <Button
                        onClick={handleNewChat}
                        className="w-full justify-start gap-2 h-9"
                        size="sm"
                    >
                        <Plus className="h-4 w-4" />
                        New chat
                    </Button>
                </div>

                {/* Chat History */}
                <ScrollArea className="flex-1 px-2">
                    {state.messages.length > 0 && (
                        <div className="mb-2">
                            <p className="px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase">
                                Current
                            </p>
                            <div className="px-2 py-2 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                                <MessageSquare className="h-3 w-3 text-blue-600 dark:text-blue-400 inline mr-1.5" />
                                <span className="text-xs font-medium">Active conversation</span>
                            </div>
                        </div>
                    )}

                    {state.sessions && state.sessions.length > 0 && (
                        <div>
                            <p className="px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase">
                                History
                            </p>
                            {state.sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className="group relative px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer mb-1"
                                >
                                    <p className="text-xs font-medium truncate">{session.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500 truncate">{session.preview}</p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        className="absolute right-1 top-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Bottom */}
                <div className="border-t border-gray-200 dark:border-gray-800 p-2">
                    <Link href="/settings" onClick={onClose}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-xs" size="sm">
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Link href="/help" onClick={onClose}>
                        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-xs" size="sm">
                            <HelpCircle className="h-4 w-4" />
                            Help
                        </Button>
                    </Link>

                    <Link href="/profile" onClick={onClose}>
                        <div className="mt-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                    {state.userProfile?.avatarInitials || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{state.userProfile?.name || "User"}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-500">{state.userProfile?.accountType || "Free"}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    );
}