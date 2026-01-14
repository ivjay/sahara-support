# Prompt 08: Main Chat Page and Demo Flow

## Objective
Create the main chat page, welcome screen, and wire everything together for a working demo.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `app/chat/layout.tsx` | CREATE | Chat-specific layout |
| `app/chat/page.tsx` | CREATE | Main chat interface |
| `app/page.tsx` | MODIFY | Welcome/landing page |

---

## Step 1: Create app/chat/layout.tsx

```tsx
import { ChatProvider } from "@/lib/chat/chat-context";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <div className="h-dvh flex flex-col bg-background">
        {children}
      </div>
    </ChatProvider>
  );
}
```

---

## Step 2: Create app/chat/page.tsx

```tsx
"use client";

import { useEffect, useCallback } from "react";
import { useChatContext } from "@/lib/chat/chat-context";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { ChatInput } from "@/components/chat/ChatInput";
import { QuickActions } from "@/components/chat/QuickActions";
import { processMessage, getWelcomeMessage, handleOptionSelection } from "@/lib/chat/agent";
import { BookingOption } from "@/lib/chat/types";
import { Button } from "@/components/ui/button";
import { RotateCcw, Moon, Sun } from "lucide-react";

export default function ChatPage() {
  const {
    state,
    addMessage,
    setLoading,
    setBooking,
    clearChat,
  } = useChatContext();

  // Add welcome message on mount
  useEffect(() => {
    if (state.messages.length === 0) {
      const welcome = getWelcomeMessage();
      addMessage(welcome.content, "assistant", {
        quickReplies: welcome.quickReplies,
      });
    }
  }, []);

  // Handle sending message
  const handleSend = useCallback(async (text: string) => {
    // Add user message
    addMessage(text, "user");
    setLoading(true);

    try {
      // Process with agent
      const response = await processMessage(text, state.currentBooking);

      // Add assistant response
      addMessage(response.content, "assistant", {
        options: response.options,
        quickReplies: response.quickReplies,
      });

      // Update booking state
      if (response.newBookingState !== undefined) {
        setBooking(response.newBookingState);
      }
    } catch (error) {
      addMessage(
        "Sorry, something went wrong. Please try again.",
        "assistant"
      );
    } finally {
      setLoading(false);
    }
  }, [state.currentBooking, addMessage, setLoading, setBooking]);

  // Handle quick action selection
  const handleQuickAction = useCallback((action: string) => {
    handleSend(action);
  }, [handleSend]);

  // Handle option selection
  const handleOptionSelect = useCallback(async (option: BookingOption) => {
    addMessage(`I'll take "${option.title}"`, "user");
    setLoading(true);

    try {
      const response = await handleOptionSelection(option);
      addMessage(response.content, "assistant", {
        quickReplies: response.quickReplies,
      });
    } catch (error) {
      addMessage("Sorry, couldn't process your selection.", "assistant");
    } finally {
      setLoading(false);
    }
  }, [addMessage, setLoading]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <>
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏜️</span>
            <h1 className="font-semibold text-lg">Sahara</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-9 w-9"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only">New chat</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <ChatContainer onOptionSelect={handleOptionSelect} />

      {/* Quick Actions (show when not loading and no booking in progress) */}
      {!state.isLoading && !state.currentBooking && state.messages.length === 1 && (
        <QuickActions onSelect={handleQuickAction} />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={state.isLoading}
        placeholder={
          state.currentBooking
            ? "Type your answer..."
            : "Ask me anything..."
        }
      />
    </>
  );
}
```

---

## Step 3: Update app/page.tsx (Welcome Screen)

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Plane, Bus, Calendar, Film } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="text-4xl">🏜️</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Sahara</h1>
          <p className="text-muted-foreground">
            Your AI-powered support assistant
          </p>
        </div>

        {/* Features */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-left">I can help you with:</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-left">
              <Bus className="h-4 w-4 text-primary" />
              <span>Bus Tickets</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Plane className="h-4 w-4 text-primary" />
              <span>Flight Booking</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Appointments</span>
            </div>
            <div className="flex items-center gap-2 text-left">
              <Film className="h-4 w-4 text-primary" />
              <span>Movie Tickets</span>
            </div>
          </div>
        </Card>

        {/* CTA Button */}
        <Link href="/chat">
          <Button size="lg" className="w-full gap-2">
            <MessageSquare className="h-5 w-5" />
            Start Chatting
          </Button>
        </Link>

        {/* Demo Note */}
        <p className="text-xs text-muted-foreground mt-6">
          Demo mode • No login required
        </p>
      </div>
    </main>
  );
}
```

---

## Complete File Structure

```
app/
├── page.tsx           (Welcome screen)
├── layout.tsx         (Root layout with fonts)
├── globals.css        (DO NOT MODIFY - color palette)
├── favicon.ico
└── chat/
    ├── layout.tsx     (Chat layout with provider)
    └── page.tsx       (Main chat interface)

components/
├── ui/                (Shadcn components)
└── chat/
    ├── ChatMessage.tsx
    ├── ChatContainer.tsx
    ├── ChatInput.tsx
    ├── TypingIndicator.tsx
    ├── QuickActions.tsx
    └── OptionCard.tsx

lib/
├── utils.ts           (Shadcn utility)
└── chat/
    ├── types.ts
    ├── mock-data.ts
    ├── utils.ts
    ├── chat-context.tsx
    └── agent.ts

public/
├── manifest.json
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Verification Checklist

### Run the App

```powershell
npm run dev
```

### Test the Flow

1. **Welcome Screen** (http://localhost:3000)
   - [ ] Logo and title visible
   - [ ] Features card shows 4 services
   - [ ] "Start Chatting" button works
   - [ ] "Demo mode" note visible

2. **Chat Page** (http://localhost:3000/chat)
   - [ ] Header shows "Sahara" with theme toggle
   - [ ] Welcome message appears
   - [ ] Quick action buttons visible
   - [ ] Message input works
   - [ ] Enter key sends message

3. **Booking Flow Test**
   - [ ] Type "book a bus ticket"
   - [ ] Agent asks "Where from?"
   - [ ] Answer → asks "Where to?"
   - [ ] Answer → asks "What date?"
   - [ ] Answer → asks "How many passengers?"
   - [ ] Answer → shows bus options as cards
   - [ ] Click "Select" on an option
   - [ ] Confirmation message appears

4. **UI Verification**
   - [ ] Dark mode toggle works
   - [ ] "New chat" button clears messages
   - [ ] Typing indicator shows during responses
   - [ ] Messages align correctly (user right, bot left)
   - [ ] Responsive on mobile viewport

5. **PWA Check** (Chrome DevTools > Application)
   - [ ] Manifest loads without errors
   - [ ] App is installable

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| TypeScript errors | Run `npx tsc --noEmit` to check |
| Component not found | Verify import paths use `@/` alias |
| Styles not applying | Check if Tailwind classes exist |
| Context error | Ensure `ChatProvider` wraps the page |

---

## What's Next?

After completing all 8 prompts, you'll have a working demo with:
- ✅ PWA-ready app
- ✅ Chat interface with mock AI responses
- ✅ Booking flows for bus, flights, appointments, movies
- ✅ Demo mode (no auth required)
- ✅ Dark mode support

**Future enhancements** (separate prompts):
- Real AI backend integration
- User authentication
- Payment processing
- Notification system
- Web browsing capabilities
