"use client";

import { useState } from "react";
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
    Trash2,
    Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
}

// Mock chat history with categories
const todayChats = [
    { id: "1", title: "Bus booking to Pokhara", pinned: true },
    { id: "2", title: "Flight inquiry to Delhi", pinned: false },
];

const yesterdayChats = [
    { id: "3", title: "Doctor appointment", pinned: false },
    { id: "4", title: "Movie tickets booking", pinned: false },
];

export function Sidebar({ isOpen, onClose, onNewChat }: SidebarProps) {
    const [hoveredChat, setHoveredChat] = useState<string | null>(null);
    const [activeChat, setActiveChat] = useState<string>("1");

    const ChatItem = ({ chat, onClick }: { chat: { id: string; title: string; pinned?: boolean }; onClick: () => void }) => (
        <div
            onMouseEnter={() => setHoveredChat(chat.id)}
            onMouseLeave={() => setHoveredChat(null)}
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all",
                activeChat === chat.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
            )}
        >
            {chat.pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
            <MessageSquare className={cn("h-4 w-4 shrink-0", chat.pinned && "hidden")} />
            <span className="text-[13px] truncate flex-1">{chat.title}</span>

            {hoveredChat === chat.id && (
                <div className="flex items-center gap-0.5 ml-auto">
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );

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
                    "fixed lg:static inset-y-0 left-0 z-50 w-[280px] lg:w-[260px]",
                    "bg-background/95 backdrop-blur-xl border-r border-border",
                    "flex flex-col transition-transform duration-200 ease-out",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Header */}
                <div className="h-14 px-4 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md" />
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                                <HeartHandshake className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="font-semibold text-[15px] leading-tight">Sahara</h2>
                            <p className="text-[10px] text-muted-foreground">AI Assistant</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 lg:hidden"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <Button
                        onClick={onNewChat}
                        className="w-full gap-2 h-10 rounded-xl shadow-sm"
                        variant="default"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New chat</span>
                    </Button>
                </div>

                {/* Chat History */}
                <ScrollArea className="flex-1 px-2">
                    {/* Today */}
                    <div className="mb-4">
                        <p className="px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Today
                        </p>
                        <div className="space-y-0.5">
                            {todayChats.map((chat) => (
                                <ChatItem key={chat.id} chat={chat} onClick={() => setActiveChat(chat.id)} />
                            ))}
                        </div>
                    </div>

                    {/* Yesterday */}
                    <div className="mb-4">
                        <p className="px-2 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Yesterday
                        </p>
                        <div className="space-y-0.5">
                            {yesterdayChats.map((chat) => (
                                <ChatItem key={chat.id} chat={chat} onClick={() => setActiveChat(chat.id)} />
                            ))}
                        </div>
                    </div>
                </ScrollArea>

                {/* Bottom Navigation */}
                <div className="border-t border-border">
                    <div className="p-2 space-y-0.5">
                        <Link href="/settings" className="block">
                            <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-[13px] font-normal">
                                <Settings className="h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                        <Link href="/help" className="block">
                            <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-[13px] font-normal">
                                <HelpCircle className="h-4 w-4" />
                                Help & Support
                            </Button>
                        </Link>
                    </div>

                    {/* User Profile */}
                    <div className="p-3 pt-0">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                            <Avatar className="h-9 w-9 bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center shadow-sm">
                                <User className="h-4 w-4 text-primary-foreground" />
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium truncate">Demo User</p>
                                <p className="text-[10px] text-muted-foreground">Free Plan</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
