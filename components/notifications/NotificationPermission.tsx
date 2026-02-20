"use client";

/**
 * NotificationPermission - Request browser notification permission
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications/reminder-scheduler';

export function NotificationPermission() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        setPermission(Notification.permission);

        // Show prompt if permission not yet requested
        if (Notification.permission === 'default') {
            // Delay showing prompt by 3 seconds to not be intrusive
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission();
        setPermission(granted ? 'granted' : 'denied');
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    // Don't show if permission already granted or denied
    if (!showPrompt || permission !== 'default') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
            <Card className="p-4 shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
                <div className="flex gap-3">
                    <div className="shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">
                            Enable Booking Reminders
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Get notified 1 hour before your bookings so you never miss an appointment!
                        </p>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={handleEnableNotifications}
                                className="h-8 text-xs"
                            >
                                Enable Notifications
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="h-8 text-xs"
                            >
                                Not now
                            </Button>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </Card>
        </div>
    );
}
