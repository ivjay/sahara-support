"use client";

/**
 * NotificationItem - Individual notification card
 */

import { Notification } from '@/lib/notifications/types';
import { formatTimeAgo, getNotificationIcon } from '@/lib/notifications/notification-utils';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
    const router = useRouter();

    const handleClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        if (notification.action_url) {
            router.push(notification.action_url);
        }
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    };

    const icon = notification.icon || getNotificationIcon(notification.type, notification.category);

    return (
        <div
            onClick={handleClick}
            className={cn(
                "group relative flex gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                notification.read
                    ? "bg-background hover:bg-muted/50"
                    : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-950/30"
            )}
        >
            {/* Icon */}
            <div className="shrink-0 text-2xl mt-0.5">
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                        "text-sm font-semibold leading-tight",
                        !notification.read && "text-blue-900 dark:text-blue-100"
                    )}>
                        {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(notification.created_at)}
                    </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {notification.message}
                </p>

                {/* Priority badge */}
                {notification.priority === 'urgent' && (
                    <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-[10px] font-bold">
                        <span className="animate-pulse">⚡</span> URGENT
                    </div>
                )}
            </div>

            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-muted"
                aria-label="Delete notification"
            >
                <X className="w-3 h-3 text-muted-foreground" />
            </button>

            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
            )}
        </div>
    );
}
