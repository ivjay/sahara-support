/**
 * Reminder Scheduler - Handles scheduled reminder notifications
 */

import { supabase } from '@/lib/supabase';
import type { Notification } from './types';
import { withRetry } from '@/lib/api/error-handler';
import { getServiceReminderHours, getServiceCheckInTime } from '@/lib/booking/service-helpers';

/**
 * Check for pending scheduled notifications and mark them as delivered
 */
export async function checkAndDeliverScheduledReminders(userId: string): Promise<Notification[]> {
    try {
        const now = new Date();

        // Fetch pending reminders that are due
        const { data: reminders, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('delivered', false)
            .not('scheduled_for', 'is', null)
            .lte('scheduled_for', now.toISOString())
            .order('scheduled_for', { ascending: true });

        if (error) {
            console.error('Error fetching scheduled reminders:', error);
            return [];
        }

        if (!reminders || reminders.length === 0) {
            return [];
        }

        // Mark all fetched reminders as delivered
        const reminderIds = reminders.map(r => r.id);
        const { error: updateError } = await supabase
            .from('notifications')
            .update({ delivered: true })
            .in('id', reminderIds);

        if (updateError) {
            console.error('Error marking reminders as delivered:', updateError);
        }

        console.log(`[Reminder Scheduler] Delivered ${reminders.length} scheduled reminder(s)`);
        return reminders as Notification[];
    } catch (error) {
        console.error('Failed to check scheduled reminders:', error);
        return [];
    }
}

/**
 * Schedule reminder notifications for a booking
 */
export async function scheduleBookingReminders(
    userId: string,
    bookingId: string,
    serviceType: string,
    bookingDateTime: Date,
    destination?: string
): Promise<void> {
    const now = new Date();
    const reminders: Array<{
        user_id: string;
        booking_id: string;
        type: string;
        title: string;
        message: string;
        action_url: string;
        icon: string;
        priority: string;
        category: string;
        scheduled_for: string;
        delivered: boolean;
        read: boolean;
    }> = [];

    // Helper to format time
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Get reminder hours using service helper
    const reminderHours = getServiceReminderHours(serviceType);
    const oneHourBefore = new Date(bookingDateTime.getTime() - reminderHours * 60 * 60 * 1000);

    if (oneHourBefore > now) {
        const destinationText = destination ? ` to ${destination}` : '';
        const urgentLabel = serviceType === 'flight' ? '3 Hours' : '1 Hour';

        reminders.push({
            user_id: userId,
            booking_id: bookingId,
            type: 'reminder',
            title: `🚨 Departing in ${urgentLabel}!`,
            message: `Your ${serviceType}${destinationText} departs at ${formatTime(bookingDateTime)}. Start heading out!`,
            action_url: `/profile?booking=${bookingId}`,
            icon: '⏰',
            priority: 'urgent',
            category: 'reminder',
            scheduled_for: oneHourBefore.toISOString(),
            delivered: false,
            read: false,
        });
    }

    // 24-hour reminder
    const twentyFourHoursBefore = new Date(bookingDateTime.getTime() - 24 * 60 * 60 * 1000);

    if (twentyFourHoursBefore > now) {
        const destinationText = destination ? ` to ${destination}` : '';
        const serviceLabel = serviceType.charAt(0).toUpperCase() + serviceType.slice(1);

        reminders.push({
            user_id: userId,
            booking_id: bookingId,
            type: 'reminder',
            title: `⏰ Reminder: ${serviceLabel} Tomorrow`,
            message: `Your ${serviceType}${destinationText} departs tomorrow at ${formatTime(bookingDateTime)}. Don't forget!`,
            action_url: `/profile?booking=${bookingId}`,
            icon: '🔔',
            priority: 'high',
            category: 'reminder',
            scheduled_for: twentyFourHoursBefore.toISOString(),
            delivered: false,
            read: false,
        });
    }

    // Check-in reminder using service helper
    const checkInMinutes = getServiceCheckInTime(serviceType);
    const checkInBefore = new Date(bookingDateTime.getTime() - checkInMinutes * 60 * 1000);

    if (checkInBefore > now) {
        reminders.push({
            user_id: userId,
            booking_id: bookingId,
            type: 'reminder',
            title: '📍 Time to Check In',
            message: `Please arrive ${checkInMinutes} minutes early for your ${serviceType}. Booking ID: ${bookingId}`,
            action_url: `/profile?booking=${bookingId}`,
            icon: '🎫',
            priority: 'normal',
            category: 'reminder',
            scheduled_for: checkInBefore.toISOString(),
            delivered: false,
            read: false,
        });
    }

    // Insert all reminders with retry logic
    if (reminders.length > 0) {
        try {
            await withRetry(async () => {
                const { error } = await supabase
                    .from('notifications')
                    .insert(reminders);

                if (error) {
                    throw new Error(`Failed to schedule reminders: ${error.message}`);
                }
            }, 3, 500); // Max 3 retries, 500ms base delay

            console.log(`[Reminder Scheduler] Scheduled ${reminders.length} reminder(s) for booking ${bookingId}`);
        } catch (error) {
            console.error('Error scheduling reminders after retries:', error);
            throw error; // Re-throw so caller knows it failed
        }
    }
}

/**
 * Show browser notification if permission is granted
 */
export function showBrowserNotification(notification: Notification): void {
    if (typeof window === 'undefined') return;

    if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotif = new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: notification.id,
            requireInteraction: notification.priority === 'urgent',
        });

        // Navigate to action URL when clicked
        browserNotif.onclick = () => {
            window.focus();
            if (notification.action_url) {
                window.location.href = notification.action_url;
            }
            browserNotif.close();
        };
    }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}
