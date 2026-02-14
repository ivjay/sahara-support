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
import { Receipt } from "./Receipt";

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
            {/* Vibrant Avatar */}
            <Avatar className={cn(
                "h-10 w-10 flex items-center justify-center shrink-0 transition-all hover:scale-110 shadow-lg",
                isUser
                    ? "bg-gradient-to-br from-primary via-chart-2 to-chart-3 shadow-primary/30 neon-glow"
                    : "bg-gradient-to-br from-muted to-muted/50 border-2 border-primary/20"
            )}>
                {isUser ? (
                    <User className="h-5 w-5 text-white" strokeWidth={2.5} />
                ) : (
                    <HeartHandshake className="h-5 w-5 text-primary" strokeWidth={2} />
                )}
            </Avatar>

            {/* Message Content */}
            <div className={cn("flex flex-col max-w-[85%] lg:max-w-[75%]", isUser && "items-end")}>
                <div
                    className={cn(
                        "px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed transition-all shadow-md hover:shadow-xl",
                        isUser
                            ? "bg-gradient-to-br from-primary via-chart-2 to-chart-3 text-white rounded-br-md shadow-primary/30"
                            : "bg-gradient-to-br from-card to-muted/50 border border-border/50 rounded-bl-md backdrop-blur-sm"
                    )}
                >
                    <div className="whitespace-pre-wrap">
                        {formatMessageContent(message.content)}
                    </div>
                </div>

                {/* Inline Receipt Card */}
                {!isUser && message.receipt && (
                    <Receipt data={message.receipt as any} />
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
