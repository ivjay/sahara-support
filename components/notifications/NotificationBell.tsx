"use client";

/**
 * NotificationBell - Header icon with unread badge
 */

import { useState } from 'react';
import { useNotifications } from '@/lib/notifications/notification-context';
import { NotificationCenter } from './NotificationCenter';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { state } = useNotifications();
    const { unreadCount } = state;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative",
                    isOpen && "bg-muted"
                )}
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <Bell className="h-5 w-5" />

                {/* Unread badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}

                {/* Ring animation for new notifications */}
                {unreadCount > 0 && (
                    <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-75" />
                )}
            </Button>

            <NotificationCenter
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </div>
    );
}
