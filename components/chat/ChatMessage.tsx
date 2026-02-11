"use client";

import { Message } from "@/lib/chat/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/chat/utils";
import { cn } from "@/lib/utils";
import { User, HeartHandshake, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { processMessage } from "@/lib/chat/agent";
import { useServices } from "@/lib/services/service-context";
import { ReceiptCard } from "./ReceiptCard";

interface ChatMessageProps {
    message: Message;
}

// Simple markdown-like text formatting
function formatMessageContent(content: string): React.ReactNode {
    const lines = content.split('\n');

    return lines.map((line, i) => {
        let formattedLine: React.ReactNode = line;

        // Handle bold text **text**
        if (line.includes('**')) {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            formattedLine = parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
            );
        }

        // Handle bullet points
        if (line.startsWith('• ') || line.startsWith('- ')) {
            return (
                <div key={i} className="flex gap-2 items-start">
                    <span className="text-primary">•</span>
                    <span>{typeof formattedLine === 'string' ? formattedLine.slice(2) : formattedLine}</span>
                </div>
            );
        }

        if (line.trim() === '') {
            return <br key={i} />;
        }

        return <div key={i}>{formattedLine}</div>;
    });
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";
    const [copied, setCopied] = useState(false);
    const { addMessage, setLoading } = useChatContext();
    const { services } = useServices();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleQuickReply = async (reply: string) => {
        addMessage(reply, "user");
        setLoading(true);

        try {
            const response = await processMessage(reply, null, services);
            addMessage(response.content, "assistant", {
                options: response.options,
                quickReplies: response.quickReplies,
            });
        } catch (error) {
            addMessage("Sorry, something went wrong.", "assistant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={cn(
                "flex gap-3 mb-4",
                isUser ? "flex-row-reverse animate-slide-in-right" : "flex-row animate-slide-in-left"
            )}
        >
            {/* Avatar with pulse on assistant */}
            <Avatar className={cn(
                "h-8 w-8 flex items-center justify-center shrink-0 transition-transform hover:scale-110",
                isUser
                    ? "bg-primary"
                    : "bg-muted border border-border"
            )}>
                {isUser ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                ) : (
                    <HeartHandshake className="h-4 w-4 text-primary" strokeWidth={1.5} />
                )}
            </Avatar>

            {/* Message Content */}
            <div className={cn("flex flex-col max-w-[85%] lg:max-w-[75%]", isUser && "items-end")}>
                <div
                    className={cn(
                        "px-4 py-3 rounded-2xl text-[14px] leading-relaxed transition-all hover-lift",
                        isUser
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                    )}
                >
                    <div className="whitespace-pre-wrap">
                        {formatMessageContent(message.content)}
                    </div>
                </div>

                {/* Inline Receipt Card */}
                {!isUser && message.receipt && (
                    <ReceiptCard data={message.receipt as any} />
                )}

                {/* Quick Replies with stagger animation */}
                {!isUser && message.quickReplies && message.quickReplies.length > 0 && !message.content.includes("Verifying") && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {message.quickReplies.map((reply, index) => (
                            <Button
                                key={reply}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickReply(reply)}
                                className="h-8 text-[12px] rounded-full hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover-scale animate-fade-in-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {reply}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Actions & Timestamp */}
                <div className="flex items-center gap-2 mt-1.5 px-1">
                    {!isUser && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-50 hover:opacity-100 hover:scale-110 transition-all"
                            onClick={copyToClipboard}
                        >
                            {copied ? (
                                <Check className="h-3 w-3 text-green-500" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.timestamp)}
                    </span>
                </div>
            </div>
        </div>
    );
}
