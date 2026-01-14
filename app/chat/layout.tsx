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
    };

    return (
        <ChatProvider>
            <div className="h-dvh flex bg-background">
                {/* Mobile menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-3 left-3 h-10 w-10 z-50 lg:hidden bg-background border border-border shadow-sm"
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
