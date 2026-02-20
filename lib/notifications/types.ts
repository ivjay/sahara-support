/**
 * Notification System - Type Definitions
 */

export type NotificationType = 'confirmation' | 'reminder' | 'payment' | 'update' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationCategory = 'booking' | 'reminder' | 'payment' | 'system';

export interface Notification {
    id: string;
    user_id: string;
    booking_id?: string;

    // Content
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    icon?: string;

    // Status & metadata
    read: boolean;
    delivered: boolean;
    priority: NotificationPriority;
    category: NotificationCategory;

    // Timestamps
    created_at: string;
    scheduled_for?: string;
    read_at?: string;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

export interface NotificationContextType {
    state: NotificationState;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    createNotification: (data: CreateNotificationData) => Promise<Notification | null>;
}

export interface CreateNotificationData {
    user_id: string;
    booking_id?: string;
    type: NotificationType;
    title: string;
    message: string;
    action_url?: string;
    icon?: string;
    priority?: NotificationPriority;
    category?: NotificationCategory;
    scheduled_for?: string;
}

// Template data interfaces
export interface BookingConfirmationData {
    serviceType: string;
    destination?: string;
    date: string;
    time: string;
    bookingId: string;
}

export interface ReminderData {
    serviceType: string;
    destination?: string;
    time: string;
    bookingId: string;
}

export interface PaymentData {
    amount: number;
    currency: string;
    bookingId: string;
}
