"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function ChatInput({
    onSend,
    disabled = false,
    placeholder = "Type your message...",
}: ChatInputProps) {
    const [value, setValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus when enabled
    useEffect(() => {
        if (!disabled && !isSending && textareaRef.current) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 10);
        }
    }, [disabled, isSending]);

    const handleSend = () => {
        const trimmedValue = value.trim();
        if (trimmedValue && !disabled) {
            setIsSending(true);
            onSend(trimmedValue);
            setValue("");

            // Reset after brief animation
            setTimeout(() => setIsSending(false), 150);

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };

    const canSend = value.trim().length > 0 && !disabled;

    return (
        <div className="p-4 pt-2 border-t border-border/50 bg-background/80 backdrop-blur-md">
            <div className="max-w-3xl mx-auto">
                {/* Input Container - Enhanced */}
                <div className={cn(
                    "relative flex items-end gap-2 bg-muted/50 rounded-2xl border p-3 transition-all duration-300",
                    canSend
                        ? "border-primary/40 shadow-lg shadow-primary/10 bg-muted/70"
                        : "border-border/50",
                    isSending && "scale-[0.99]"
                )}>
                    {/* Gradient glow effect when active */}
                    {canSend && (
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-chart-2/20 to-primary/20 rounded-2xl -z-10 blur-sm" />
                    )}
                    {/* Input Field */}
                    <Textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={1}
                        className={cn(
                            "flex-1 resize-none min-h-[24px] max-h-[150px] py-1 px-1",
                            "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
                            "placeholder:text-muted-foreground/70 text-[15px] leading-relaxed",
                            "scrollbar-thin"
                        )}
                    />

                    {/* Send Button */}
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!canSend}
                        className={cn(
                            "h-8 w-8 shrink-0 rounded-lg transition-all duration-200",
                            canSend
                                ? "bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95"
                                : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {disabled ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className={cn("h-4 w-4 transition-transform", isSending && "-translate-y-1 opacity-0")} />
                        )}
                    </Button>
                </div>

                {/* Helper Text */}
                <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
