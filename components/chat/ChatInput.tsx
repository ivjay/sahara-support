"use client";

import { useState, useRef, KeyboardEvent } from "react";
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmedValue = value.trim();
        if (trimmedValue && !disabled) {
            onSend(trimmedValue);
            setValue("");

            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter (without Shift)
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);

        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    };

    const canSend = value.trim().length > 0 && !disabled;

    return (
        <div className="p-4 pt-2">
            <div className="max-w-3xl mx-auto">
                {/* Input Container */}
                <div className="relative flex items-end gap-2 bg-muted rounded-2xl border border-border shadow-sm p-3">
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
                            "h-8 w-8 shrink-0 rounded-lg transition-all",
                            canSend
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {disabled ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Helper Text */}
                <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
                    Sahara can make mistakes. Check important info.
                </p>
            </div>
        </div>
    );
}
