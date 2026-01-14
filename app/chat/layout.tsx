"use client";

import { ReactNode } from "react";
import { ChatProvider } from "@/lib/chat/chat-context";

export default function ChatLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <ChatProvider>
            {children}
        </ChatProvider>
    );
}
