/**
 * RPC Response Type Definitions
 * Strongly-typed interfaces for database RPC function responses
 * This eliminates 'any' types and provides compile-time type safety
 */

// =============================================
// Hybrid Search Types
// =============================================

/**
 * Response type for hybrid_search() RPC function
 * Represents a single search result row
 */
export interface HybridSearchRow {
    id: string;
    service_id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    location: string;
    capacity: number | null;
    price: number | null;
    rating_avg: number;
    images: string[] | null;
    tags: string[] | null;
    text_score: number;
    vector_score: number;
    business_score: number;
    final_score: number;
}

// =============================================
// Venue Types
// =============================================

/**
 * Seat configuration structure (nested JSON)
 */
export interface SeatConfig {
    rows: Array<{
        label: string;
        seats: Array<{
            number: number;
            label?: string;
            type?: 'regular' | 'premium' | 'vip' | 'disabled';
            price?: number;
        }>;
    }>;
}

/**
 * Response type for venues table queries
 */
export interface VenueRow {
    id: string;
    name: string;
    type: 'theater' | 'bus' | 'appointment' | 'other';
    location: string | null;
    total_capacity: number | null;
    seat_config: SeatConfig;
    created_at: string;
    updated_at: string;
}

// =============================================
// Seat Inventory Types
// =============================================

/**
 * Response type for seat_inventory table queries
 */
export interface SeatInventoryRow {
    id: string;
    venue_id: string;
    service_id: string;
    event_date: string;
    event_time: string;
    seat_label: string;
    seat_type: 'regular' | 'premium' | 'vip' | 'disabled';
    status: 'available' | 'reserved' | 'booked' | 'blocked';
    reserved_by: string | null;
    reserved_at: string | null;
    reservation_expires_at: string | null;
    booking_id: string | null;
    price_override: number | null;
    created_at: string;
    updated_at: string;
}

/**
 * Response type for reserve_seats() RPC function
 * Returns an array of results, one per seat
 */
export interface ReserveSeatResult {
    seat_label: string;
    success: boolean;
    message: string;
}

// =============================================
// Booking Types
// =============================================

/**
 * Response type for bookings table queries
 */
export interface BookingRow {
    id: string;
    booking_id: string;
    user_id: string;
    service_id: string;
    service_type: string;
    service_title: string;
    category: string;
    event_date: string;
    event_time: string | null;
    num_passengers: number;
    passenger_details: PassengerDetail[] | null;
    seat_labels: string[] | null;
    venue_id: string | null;
    total_price: number;
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_id: string | null;
    booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    verification_status: 'pending' | 'approved' | 'rejected';
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PassengerDetail {
    name: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    phone?: string;
    email?: string;
    seat?: string;
    specialNeeds?: string;
}

// =============================================
// Notification Types
// =============================================

/**
 * Response type for notifications table queries
 */
export interface NotificationRow {
    id: string;
    user_id: string;
    booking_id: string | null;
    type: 'confirmation' | 'reminder' | 'payment' | 'update' | 'system';
    title: string;
    message: string;
    action_url: string | null;
    icon: string | null;
    read: boolean;
    delivered: boolean;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: 'booking' | 'reminder' | 'payment' | 'system';
    created_at: string;
    scheduled_for: string | null;
    read_at: string | null;
}

/**
 * Realtime payload type for notification subscriptions
 */
export interface NotificationRealtimePayload {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: NotificationRow;
    old: NotificationRow | null;
}

// =============================================
// Payment Types
// =============================================

/**
 * Response type for payments table queries
 */
export interface PaymentRow {
    id: string;
    payment_id: string;
    booking_id: string;
    user_id: string;
    amount: number;
    currency: string;
    payment_method: 'khalti' | 'esewa' | 'card' | 'cash' | 'other';
    payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    khalti_idx: string | null;
    khalti_token: string | null;
    esewa_ref_id: string | null;
    payment_metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// Service Types
// =============================================

/**
 * Full service row type (for direct service queries)
 */
export interface ServiceRow {
    id: string;
    service_id: string;
    type: 'movie' | 'bus' | 'appointment' | 'other';
    title: string;
    subtitle: string | null;
    description: string;
    category: string;
    location: string;
    duration_minutes: number | null;
    capacity: number | null;
    price: number;
    currency: string;
    images: string[] | null;
    tags: string[] | null;
    venue_id: string | null;
    schedule: Record<string, unknown> | null;
    meta: Record<string, unknown> | null;
    rating_avg: number;
    booking_count: number;
    view_count: number;
    embedding: number[] | null;
    search_vector: unknown | null; // tsvector type
    created_at: string;
    updated_at: string;
}

// =============================================
// User & Profile Types
// =============================================

/**
 * User authentication record (from auth.users)
 */
export interface AuthUser {
    id: string;
    email: string;
    phone: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * User profile record (from profiles table)
 */
export interface ProfileRow {
    id: string;
    user_id: string;
    full_name: string | null;
    phone: string | null;
    role: 'user' | 'admin' | 'staff';
    avatar_url: string | null;
    preferences: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

// =============================================
// Helper Type Guards
// =============================================

/**
 * Type guard to check if a value is a valid HybridSearchRow
 */
export function isHybridSearchRow(value: unknown): value is HybridSearchRow {
    const v = value as Record<string, unknown>;
    return (
        !!v &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.service_id === 'string' &&
        typeof v.type === 'string' &&
        typeof v.title === 'string' &&
        typeof v.description === 'string' &&
        typeof v.category === 'string' &&
        typeof v.location === 'string' &&
        typeof v.rating_avg === 'number' &&
        typeof v.text_score === 'number' &&
        typeof v.vector_score === 'number' &&
        typeof v.business_score === 'number' &&
        typeof v.final_score === 'number'
    );
}

/**
 * Type guard to check if a value is a valid VenueRow
 */
export function isVenueRow(value: unknown): value is VenueRow {
    const v = value as Record<string, unknown>;
    return (
        !!v &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        typeof v.type === 'string' &&
        !!v.seat_config &&
        typeof v.seat_config === 'object' &&
        Array.isArray((v.seat_config as Record<string, unknown>).rows)
    );
}

/**
 * Type guard to check if a value is a valid SeatInventoryRow
 */
export function isSeatInventoryRow(value: unknown): value is SeatInventoryRow {
    const v = value as Record<string, unknown>;
    return (
        !!v &&
        typeof v === 'object' &&
        typeof v.id === 'string' &&
        typeof v.venue_id === 'string' &&
        typeof v.service_id === 'string' &&
        typeof v.event_date === 'string' &&
        typeof v.seat_label === 'string' &&
        typeof v.status === 'string' &&
        ['available', 'reserved', 'booked', 'blocked'].includes(v.status as string)
    );
}

// =============================================
// Utility Types
// =============================================

/**
 * Generic Supabase response wrapper
 */
export interface SupabaseResponse<T> {
    data: T | null;
    error: {
        message: string;
        details?: string;
        hint?: string;
        code?: string;
    } | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
