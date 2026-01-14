# Prompt 06: Chat Input Component

## Objective
Create the message input component with send functionality, keyboard handling, and proper integration with the chat context.

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/chat/ChatInput.tsx` | Message input with send button |

---

## Step 1: Create components/chat/ChatInput.tsx

```tsx
"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
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
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end max-w-4xl mx-auto">
        {/* Input Field */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "resize-none min-h-[44px] max-h-[150px] py-3 pr-12",
              "scrollbar-thin scrollbar-thumb-muted"
            )}
          />
        </div>

        {/* Send Button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!canSend}
          className="h-11 w-11 shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
```

---

## Usage Example

```tsx
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatContext } from "@/lib/chat/chat-context";

function ChatPage() {
  const { addMessage, state, setLoading } = useChatContext();

  const handleSend = async (message: string) => {
    // Add user message
    addMessage(message, "user");
    
    // Show loading
    setLoading(true);
    
    // Process with agent (next prompt)
    // ...
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <ChatContainer />
      <ChatInput 
        onSend={handleSend} 
        disabled={state.isLoading} 
      />
    </div>
  );
}
```

---

## Features Implemented

| Feature | Description |
|---------|-------------|
| Auto-resize | Textarea grows with content (max 150px) |
| Enter to send | Press Enter to send message |
| Shift+Enter | New line without sending |
| Loading state | Shows spinner when disabled |
| Disabled state | Prevents sending while processing |
| Clear on send | Input clears after sending |

---

## Styling Notes

> ⚠️ Uses existing CSS variables only:
> - `bg-background` for container
> - `border-t` uses `--border` color
> - Button uses `bg-primary`

---

## Mobile Considerations

- Input is fixed at bottom of screen (handled in page layout)
- Touch-friendly button size (44x44 minimum)
- Keyboard will push input up on mobile

---

## Verification

1. TypeScript compiles without errors
2. Enter key sends message
3. Shift+Enter creates new line
4. Button disabled when input is empty
5. Input clears after sending

---

## Next Step

→ Proceed to **Prompt 07: Agentic Response Logic**
