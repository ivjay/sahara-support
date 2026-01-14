"use client";

import { useState } from "react";
import { ChatProvider } from "@/lib/chat/chat-context";
import { Sidebar } from "@/components/chat/Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleNewChat = () => {
        setSidebarOpen(false);
        window.dispatchEvent(new CustomEvent('sahara-new-chat'));
    };

    return (
        <ChatProvider>
            <div className="h-dvh flex bg-background relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-chart-2/5 rounded-full blur-3xl" />
                </div>

                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-2 left-2 h-10 w-10 z-50 lg:hidden bg-background/80 backdrop-blur-sm shadow-sm border border-border"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                </Button>

                {/* Sidebar */}
                <Sidebar
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onNewChat={handleNewChat}
                />

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0">
                    {children}
                </main>
            </div>
        </ChatProvider>
    );
}
