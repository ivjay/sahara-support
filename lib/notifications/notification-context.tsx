"use client";

/**
 * Notification Context - State management & React Context
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import type {
    Notification,
    NotificationState,
    NotificationContextType,
    CreateNotificationData,
} from './types';
import {
    fetchNotifications as apiFetchNotifications,
    createNotification as apiCreateNotification,
    markNotificationAsRead as apiMarkAsRead,
    markAllNotificationsAsRead as apiMarkAllAsRead,
    deleteNotification as apiDeleteNotification,
    subscribeToNotifications,
} from './notification-service';
import {
    checkAndDeliverScheduledReminders,
    showBrowserNotification,
} from './reminder-scheduler';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [state, setState] = useState<NotificationState>({
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
    });

    // Fetch notifications when user logs in
    const fetchNotifications = useCallback(async () => {
        if (!user?.uid) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const notifications = await apiFetchNotifications(user.uid);
            const unreadCount = notifications.filter(n => !n.read).length;

            setState({
                notifications,
                unreadCount,
                isLoading: false,
                error: null,
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to load notifications',
            }));
        }
    }, [user?.uid]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: string) => {
        const success = await apiMarkAsRead(id);
        if (success) {
            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n =>
                    n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
                ),
                unreadCount: Math.max(0, prev.unreadCount - 1),
            }));
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.uid) return;

        const success = await apiMarkAllAsRead(user.uid);
        if (success) {
            setState(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({
                    ...n,
                    read: true,
                    read_at: n.read ? n.read_at : new Date().toISOString(),
                })),
                unreadCount: 0,
            }));
        }
    }, [user?.uid]);

    // Delete notification
    const deleteNotification = useCallback(async (id: string) => {
        const success = await apiDeleteNotification(id);
        if (success) {
            setState(prev => {
                const notification = prev.notifications.find(n => n.id === id);
                const wasUnread = notification && !notification.read;

                return {
                    ...prev,
                    notifications: prev.notifications.filter(n => n.id !== id),
                    unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
                };
            });
        }
    }, []);

    // Create notification
    const createNotification = useCallback(async (data: CreateNotificationData) => {
        const notification = await apiCreateNotification(data);
        if (notification) {
            setState(prev => ({
                ...prev,
                notifications: [notification, ...prev.notifications],
                unreadCount: prev.unreadCount + 1,
            }));
        }
        return notification;
    }, []);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.uid) return;

        // Initial fetch
        fetchNotifications();

        // Check for scheduled reminders immediately and periodically
        const checkReminders = async () => {
            const pendingReminders = await checkAndDeliverScheduledReminders(user.uid);

            // Add delivered reminders to state
            if (pendingReminders.length > 0) {
                setState(prev => ({
                    ...prev,
                    notifications: [...pendingReminders, ...prev.notifications],
                    unreadCount: prev.unreadCount + pendingReminders.length,
                }));

                // Show browser notifications for delivered reminders
                pendingReminders.forEach(reminder => {
                    showBrowserNotification(reminder);
                });
            }
        };

        // Check immediately on mount
        checkReminders();

        // Check every 2 minutes for scheduled reminders
        const reminderInterval = setInterval(checkReminders, 2 * 60 * 1000);

        // Subscribe to new notifications
        const unsubscribe = subscribeToNotifications(user.uid, (newNotification) => {
            setState(prev => ({
                ...prev,
                notifications: [newNotification, ...prev.notifications],
                unreadCount: prev.unreadCount + 1,
            }));

            // Show browser notification if permission granted
            showBrowserNotification(newNotification);
        });

        return () => {
            unsubscribe();
            clearInterval(reminderInterval);
        };
    }, [user?.uid, fetchNotifications]);

    const value = useMemo(() => ({
        state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
    }), [
        state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
    ]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
