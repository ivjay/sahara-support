/**
 * Notification Service - API calls & business logic
 */

import { supabase } from '@/lib/supabase';
import type { Notification, CreateNotificationData } from './types';
import { NotificationRow, NotificationRealtimePayload } from '@/lib/types/rpc-responses';
import { withRetry } from '@/lib/api/error-handler';

/**
 * Fetch all notifications for the current user
 */
export async function fetchNotifications(userId: string): Promise<Notification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
    }
}

/**
 * Create a new notification with retry logic
 */
export async function createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
        // Use retry logic for resilience against temporary failures
        return await withRetry(async () => {
            const { data: notification, error } = await supabase
                .from('notifications')
                .insert([{
                    user_id: data.user_id,
                    booking_id: data.booking_id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    action_url: data.action_url,
                    icon: data.icon,
                    priority: data.priority || 'normal',
                    category: data.category || 'booking',
                    scheduled_for: data.scheduled_for,
                    read: false,
                    delivered: true,
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating notification:', error);
                throw new Error(`Failed to create notification: ${error.message}`);
            }

            return notification as Notification;
        }, 3, 500); // Max 3 retries, 500ms base delay
    } catch (error) {
        console.error('Failed to create notification after retries:', error);
        return null;
    }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        return false;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Error deleting notification:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to delete notification:', error);
        return false;
    }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void
) {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes' as 'system',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`,
            },
            (payload: { new: unknown }) => {
                if (payload.new) {
                    onNewNotification(payload.new as unknown as Notification);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
