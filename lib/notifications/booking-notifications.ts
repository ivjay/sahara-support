/**
 * Booking Notifications Utility
 * Centralizes booking confirmation and reminder creation logic
 * Eliminates duplicate code across app/chat/page.tsx
 */

import { createNotification } from './notification-service';
import { scheduleBookingReminders } from './reminder-scheduler';
import { createBookingConfirmationNotification } from './notification-utils';
import type { CreateNotificationData } from './types';

export interface BookingNotificationData {
    bookingId: string;
    serviceType: string;
    destination?: string;
    date: Date | string;
    time?: string;
}

export interface UserInfo {
    id: string;
    name?: string;
    phone?: string;
}

/**
 * Create booking confirmation notification and schedule all reminders
 * This combines two operations that always happen together:
 * 1. Immediate confirmation notification
 * 2. Scheduled reminder notifications (1h, 24h, check-in)
 *
 * @returns {Promise<boolean>} Success status
 */
export async function createBookingNotificationsAndReminders(
    userInfo: UserInfo,
    bookingData: BookingNotificationData
): Promise<boolean> {
    const { bookingId, serviceType, destination, date, time } = bookingData;

    try {
        // Normalize date to string format for confirmation
        const dateString = typeof date === 'string'
            ? date
            : date.toISOString().split('T')[0];

        // Normalize date to Date object for reminders
        const dateObj = typeof date === 'string'
            ? new Date(date)
            : date;

        // Create confirmation notification data
        const confirmationData = createBookingConfirmationNotification(
            userInfo.id,
            {
                serviceType,
                destination,
                date: dateString,
                time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                bookingId,
            }
        );

        // Create and send confirmation notification
        const confirmation = await createNotification(confirmationData);
        if (!confirmation) {
            console.error('[BookingNotifications] Failed to create confirmation notification');
            return false;
        }

        // Prepare booking date-time for reminders
        let bookingDateTime = new Date(dateObj);

        // If time is provided, set it on the date
        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                bookingDateTime.setHours(hours, minutes, 0, 0);
            }
        }

        // Schedule reminder notifications
        await scheduleBookingReminders(
            userInfo.id,
            bookingId,
            serviceType,
            bookingDateTime,
            destination
        );

        console.log(`[BookingNotifications] ✅ Created notifications for booking ${bookingId}`);
        return true;
    } catch (error) {
        console.error('[BookingNotifications] Error creating notifications:', error);
        return false;
    }
}

/**
 * Create only the confirmation notification (without reminders)
 * Use when you need just immediate notification
 */
export async function createBookingConfirmation(
    userInfo: UserInfo,
    bookingData: BookingNotificationData
): Promise<boolean> {
    const { bookingId, serviceType, destination, date, time } = bookingData;

    try {
        const dateString = typeof date === 'string'
            ? date
            : date.toISOString().split('T')[0];

        const confirmationData = createBookingConfirmationNotification(
            userInfo.id,
            {
                serviceType,
                destination,
                date: dateString,
                time: time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                bookingId,
            }
        );

        const confirmation = await createNotification(confirmationData);

        if (!confirmation) {
            console.error('[BookingNotifications] Failed to create confirmation');
            return false;
        }

        return true;
    } catch (error) {
        console.error('[BookingNotifications] Error creating confirmation:', error);
        return false;
    }
}

/**
 * Create only reminder notifications (without confirmation)
 * Use when confirmation was already sent separately
 */
export async function createBookingReminders(
    userInfo: UserInfo,
    bookingData: BookingNotificationData
): Promise<boolean> {
    const { bookingId, serviceType, destination, date, time } = bookingData;

    try {
        const dateObj = typeof date === 'string'
            ? new Date(date)
            : date;

        let bookingDateTime = new Date(dateObj);

        if (time) {
            const [hours, minutes] = time.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes)) {
                bookingDateTime.setHours(hours, minutes, 0, 0);
            }
        }

        await scheduleBookingReminders(
            userInfo.id,
            bookingId,
            serviceType,
            bookingDateTime,
            destination
        );

        return true;
    } catch (error) {
        console.error('[BookingNotifications] Error creating reminders:', error);
        return false;
    }
}

/**
 * Create custom notification with automatic icon and priority
 * Helper for one-off notifications
 */
export async function createCustomNotification(
    userId: string,
    bookingId: string,
    title: string,
    message: string,
    type: 'confirmation' | 'reminder' | 'payment' | 'update' | 'system' = 'system',
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): Promise<boolean> {
    try {
        const iconMap = {
            confirmation: '🎉',
            reminder: '⏰',
            payment: '💳',
            update: '🔄',
            system: '📢'
        };

        const categoryMap = {
            confirmation: 'booking',
            reminder: 'reminder',
            payment: 'payment',
            update: 'booking',
            system: 'system'
        };

        const notificationData: CreateNotificationData = {
            user_id: userId,
            booking_id: bookingId,
            type,
            title,
            message,
            action_url: bookingId ? `/profile?booking=${bookingId}` : '/profile',
            icon: iconMap[type],
            priority,
            category: categoryMap[type] as 'booking' | 'reminder' | 'payment' | 'system'
        };

        const notification = await createNotification(notificationData);
        return !!notification;
    } catch (error) {
        console.error('[BookingNotifications] Error creating custom notification:', error);
        return false;
    }
}

/**
 * Validate notification data before sending
 * Returns validation errors or null if valid
 */
export function validateBookingNotificationData(
    bookingData: BookingNotificationData
): string | null {
    if (!bookingData.bookingId) {
        return 'Booking ID is required';
    }
    if (!bookingData.serviceType) {
        return 'Service type is required';
    }
    if (!bookingData.date) {
        return 'Date is required';
    }

    // Validate date is not in the past
    const dateObj = typeof bookingData.date === 'string'
        ? new Date(bookingData.date)
        : bookingData.date;

    if (dateObj < new Date()) {
        return 'Booking date cannot be in the past';
    }

    return null;
}
