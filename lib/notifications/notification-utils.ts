/**
 * Notification Utilities - Helpers, formatters, templates
 */

import {
    CreateNotificationData,
    BookingConfirmationData,
    ReminderData,
    PaymentData,
} from './types';

/**
 * Format time difference in human-readable format
 * e.g., "just now", "5m", "2h", "3d"
 */
export function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;

    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get icon emoji for notification type
 */
export function getNotificationIcon(type: string, category?: string): string {
    const icons: Record<string, string> = {
        confirmation: '🎉',
        reminder: '⏰',
        payment: '💳',
        update: '🔄',
        system: '📢',
    };

    return icons[type] || '🔔';
}

/**
 * Get badge color class for priority
 */
export function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
        low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    };

    return colors[priority] || colors.normal;
}

/**
 * Create booking confirmation notification
 */
export function createBookingConfirmationNotification(
    userId: string,
    data: BookingConfirmationData
): CreateNotificationData {
    const { serviceType, destination, date, time, bookingId } = data;

    const destinationText = destination ? ` to ${destination}` : '';
    const message = `Your ${serviceType}${destinationText} is confirmed for ${formatDate(date)} at ${time}`;

    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'confirmation',
        title: '🎉 Booking Confirmed!',
        message,
        action_url: `/profile?booking=${bookingId}`,
        icon: '✅',
        priority: 'high',
        category: 'booking',
    };
}

/**
 * Create 24-hour reminder notification
 */
export function create24HourReminderNotification(
    userId: string,
    data: ReminderData
): CreateNotificationData {
    const { serviceType, destination, time, bookingId } = data;

    const destinationText = destination ? ` to ${destination}` : '';
    const message = `Your ${serviceType}${destinationText} departs tomorrow at ${time}. Don't forget!`;

    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'reminder',
        title: `⏰ Reminder: ${capitalizeFirst(serviceType)} Tomorrow`,
        message,
        action_url: `/profile?booking=${bookingId}`,
        icon: '🔔',
        priority: 'high',
        category: 'reminder',
    };
}

/**
 * Create 1-hour reminder notification
 */
export function create1HourReminderNotification(
    userId: string,
    data: ReminderData
): CreateNotificationData {
    const { serviceType, destination, time, bookingId } = data;

    const destinationText = destination ? ` to ${destination}` : '';
    const message = `Your ${serviceType}${destinationText} departs at ${time}. Start heading out!`;

    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'reminder',
        title: '🚨 Departing in 1 Hour!',
        message,
        action_url: `/profile?booking=${bookingId}`,
        icon: '⏰',
        priority: 'urgent',
        category: 'reminder',
    };
}

/**
 * Create check-in reminder notification
 */
export function createCheckInReminderNotification(
    userId: string,
    data: ReminderData & { earlyMinutes: number }
): CreateNotificationData {
    const { serviceType, bookingId, earlyMinutes } = data;

    const message = `Please arrive ${earlyMinutes} minutes early for your ${serviceType}. Booking ID: ${bookingId}`;

    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'reminder',
        title: '📍 Time to Check In',
        message,
        action_url: `/profile?booking=${bookingId}`,
        icon: '🎫',
        priority: 'normal',
        category: 'reminder',
    };
}

/**
 * Create payment verification notification
 */
export function createPaymentVerifiedNotification(
    userId: string,
    data: PaymentData
): CreateNotificationData {
    const { amount, currency, bookingId } = data;

    const message = `Your payment of ${currency} ${amount} has been confirmed. Booking is now active!`;

    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'payment',
        title: '💳 Payment Verified',
        message,
        action_url: `/profile?booking=${bookingId}`,
        icon: '✅',
        priority: 'high',
        category: 'payment',
    };
}

/**
 * Create booking update notification
 */
export function createBookingUpdateNotification(
    userId: string,
    bookingId: string,
    updateMessage: string
): CreateNotificationData {
    return {
        user_id: userId,
        booking_id: bookingId,
        type: 'update',
        title: '🔄 Booking Updated',
        message: updateMessage,
        action_url: `/profile?booking=${bookingId}`,
        icon: '🔄',
        priority: 'high',
        category: 'booking',
    };
}

/**
 * Helper: Format date in readable format
 */
function formatDate(dateStr: string): string {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Calculate when to send reminders based on service type and departure time
 */
export function calculateReminderTimes(serviceType: string, departureDateTime: Date): {
    reminder24h?: Date;
    reminder1h?: Date;
    checkIn?: Date;
} {
    const now = new Date();
    const times: { reminder24h?: Date; reminder1h?: Date; checkIn?: Date } = {};

    // 24-hour reminder
    const reminder24h = new Date(departureDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
        times.reminder24h = reminder24h;
    }

    // 1-hour reminder (3 hours for flights)
    const reminderHours = serviceType === 'flight' ? 3 : 1;
    const reminder1h = new Date(departureDateTime.getTime() - reminderHours * 60 * 60 * 1000);
    if (reminder1h > now) {
        times.reminder1h = reminder1h;
    }

    // Check-in reminder (30 min for bus/flight, 10 min for appointments)
    const checkInMinutes = serviceType === 'appointment' ? 10 : 30;
    const checkIn = new Date(departureDateTime.getTime() - checkInMinutes * 60 * 1000);
    if (checkIn > now) {
        times.checkIn = checkIn;
    }

    return times;
}
