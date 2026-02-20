"use client";

/**
 * NotificationCenter - Dropdown panel with notification list
 */

import { useNotifications } from '@/lib/notifications/notification-context';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, X, CheckCheck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const { state, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
    const { notifications, unreadCount, isLoading } = state;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <Card className={cn(
                "fixed right-4 top-16 z-50 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-2",
                "animate-in slide-in-from-right-5 duration-200"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-muted transition-colors"
                        aria-label="Close notifications"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Actions */}
                {notifications.length > 0 && unreadCount > 0 && (
                    <div className="px-4 py-2 border-b bg-muted/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="w-full text-xs gap-1.5"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all as read
                        </Button>
                    </div>
                )}

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                                <Inbox className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-sm mb-1">All caught up!</h3>
                            <p className="text-xs text-muted-foreground">
                                You have no notifications at the moment
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t bg-muted/10 text-center">
                        <p className="text-xs text-muted-foreground">
                            Showing {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                )}
            </Card>
        </>
    );
}
