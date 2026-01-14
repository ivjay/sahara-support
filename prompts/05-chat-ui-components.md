# Prompt 05: Chat UI Components

## Objective
Create the visual chat components using existing shadcn components. These form the UI for displaying messages and chat interface.

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/chat/ChatMessage.tsx` | Individual message bubble |
| `components/chat/ChatContainer.tsx` | Message list with scrolling |
| `components/chat/TypingIndicator.tsx` | "Agent is typing" animation |
| `components/chat/QuickActions.tsx` | Suggested action buttons |
| `components/chat/OptionCard.tsx` | Booking option display card |

---

## Step 1: Create components/chat/ChatMessage.tsx

```tsx
"use client";

import { Message } from "@/lib/chat/types";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/chat/utils";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(
        "h-8 w-8 flex items-center justify-center",
        isUser ? "bg-primary" : "bg-muted"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </Avatar>

      {/* Message Content */}
      <div className={cn("flex flex-col max-w-[75%]", isUser && "items-end")}>
        <Card
          className={cn(
            "px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-card text-card-foreground rounded-bl-none"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </Card>
        
        {/* Timestamp */}
        <span className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
```

---

## Step 2: Create components/chat/TypingIndicator.tsx

```tsx
"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      {/* Bot Avatar */}
      <Avatar className="h-8 w-8 flex items-center justify-center bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </Avatar>

      {/* Typing Animation */}
      <Card className="px-4 py-3 bg-card rounded-bl-none">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        </div>
      </Card>
    </div>
  );
}
```

---

## Step 3: Create components/chat/QuickActions.tsx

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { QUICK_ACTIONS } from "@/lib/chat/mock-data";

interface QuickActionsProps {
  onSelect: (action: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {QUICK_ACTIONS.map((action) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="text-xs"
        >
          {action}
        </Button>
      ))}
    </div>
  );
}
```

---

## Step 4: Create components/chat/OptionCard.tsx

```tsx
"use client";

import { BookingOption } from "@/lib/chat/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OptionCardProps {
  option: BookingOption;
  onSelect: (option: BookingOption) => void;
}

export function OptionCard({ option, onSelect }: OptionCardProps) {
  return (
    <Card className="p-4 mb-3 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-sm">{option.title}</h4>
          <p className="text-xs text-muted-foreground">{option.subtitle}</p>
        </div>
        {option.price && (
          <Badge variant="secondary" className="text-sm font-medium">
            {option.currency} {option.price}
          </Badge>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        {Object.entries(option.details).map(([key, value]) => (
          <div key={key} className="text-xs">
            <span className="text-muted-foreground capitalize">{key}: </span>
            <span>{value}</span>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <Button
        size="sm"
        className="w-full"
        onClick={() => onSelect(option)}
        disabled={!option.available}
      >
        {option.available ? "Select" : "Not Available"}
      </Button>
    </Card>
  );
}
```

---

## Step 5: Create components/chat/ChatContainer.tsx

```tsx
"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { OptionCard } from "./OptionCard";
import { BookingOption } from "@/lib/chat/types";

interface ChatContainerProps {
  onOptionSelect?: (option: BookingOption) => void;
}

export function ChatContainer({ onOptionSelect }: ChatContainerProps) {
  const { state } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.isLoading]);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      {/* Welcome state */}
      {state.messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-3xl">🏜️</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Sahara</h2>
          <p className="text-muted-foreground text-sm">
            Your AI-powered support assistant. How can I help you today?
          </p>
        </div>
      )}

      {/* Message List */}
      {state.messages.map((message) => (
        <div key={message.id}>
          <ChatMessage message={message} />
          
          {/* Show options if present */}
          {message.options && message.options.length > 0 && (
            <div className="ml-11 mb-4">
              {message.options.map((option) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  onSelect={onOptionSelect || (() => {})}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Typing Indicator */}
      {state.isLoading && <TypingIndicator />}
    </ScrollArea>
  );
}
```

---

## File Structure After This Step

```
components/
├── ui/ (existing shadcn components)
└── chat/
    ├── ChatMessage.tsx     ✓
    ├── ChatContainer.tsx   ✓
    ├── TypingIndicator.tsx ✓
    ├── QuickActions.tsx    ✓
    └── OptionCard.tsx      ✓
```

---

## Styling Notes

> ⚠️ All components use existing CSS variables:
> - `bg-primary`, `text-primary-foreground`
> - `bg-card`, `text-card-foreground`
> - `bg-muted`, `text-muted-foreground`
> - No hardcoded colors!

---

## Verification

1. Check TypeScript compiles without errors
2. Verify all imports resolve correctly
3. Components use only installed shadcn components

---

## Next Step

→ Proceed to **Prompt 06: Chat Input Component**
