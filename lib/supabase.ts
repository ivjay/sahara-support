import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase environment variables not configured. Database features will be disabled.');
}

// Create Supabase client (use in frontend)
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// For server-side operations (API routes)
export const supabaseAdmin = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

// ============================================
// DATABASE TYPES
// ============================================

export type BookingType = 'movie' | 'bus' | 'flight' | 'doctor' | 'salon';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ConversationStage = 'greeting' | 'gathering' | 'confirming' | 'finalized';

export interface Booking {
    id: string;
    booking_id: string;
    user_id?: string;
    user_email?: string;
    user_phone?: string;
    booking_type: BookingType;
    status: BookingStatus;
    details: Record<string, any>;
    total_price?: number;
    currency: string;
    created_at: string;
    updated_at: string;
    notes?: string;
    metadata?: Record<string, any>;
}

export interface Conversation {
    id: string;
    conversation_id: string;
    user_id?: string;
    session_id?: string;
    current_stage: ConversationStage;
    language: 'en' | 'ne';
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
    }>;
    active_booking_type?: BookingType;
    collected_details?: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_message_at: string;
    metadata?: Record<string, any>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a unique booking ID
 */
export function generateBookingId(type: BookingType): string {
    const prefix = type.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique conversation ID
 */
export function generateConversationId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CONV-${timestamp}-${random}`;
}

/**
 * Create a new booking in the database
 */
export async function createBooking(
    bookingType: BookingType,
    details: Record<string, any>,
    userId?: string,
    totalPrice?: number
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const bookingId = generateBookingId(bookingType);

        const { data, error } = await supabase
            .from('bookings')
            .insert({
                booking_id: bookingId,
                booking_type: bookingType,
                details: details,
                user_id: userId,
                total_price: totalPrice,
                status: 'confirmed',
            })
            .select()
            .single();

        if (error) throw error;

        console.log('[Supabase] ✓ Created booking:', bookingId);
        return { success: true, bookingId };
    } catch (error) {
        console.error('[Supabase] ✗ Error creating booking:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_id', bookingId)
            .single();

        if (error) throw error;
        return data as Booking;
    } catch (error) {
        console.error('[Supabase] ✗ Error fetching booking:', error);
        return null;
    }
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Booking[];
    } catch (error) {
        console.error('[Supabase] ✗ Error fetching user bookings:', error);
        return [];
    }
}

/**
 * Get all bookings (with optional filters)
 */
export async function getAllBookings(filters?: {
    type?: BookingType;
    status?: BookingStatus;
    limit?: number;
}): Promise<Booking[]> {
    if (!supabase) return [];

    try {
        let query = supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.type) {
            query = query.eq('booking_type', filters.type);
        }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Booking[];
    } catch (error) {
        console.error('[Supabase] ✗ Error fetching bookings:', error);
        return [];
    }
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
    bookingId: string,
    status: BookingStatus
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('booking_id', bookingId);

        if (error) throw error;

        console.log('[Supabase] ✓ Updated booking status:', bookingId, '→', status);
        return { success: true };
    } catch (error) {
        console.error('[Supabase] ✗ Error updating booking:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Create or update conversation
 */
export async function saveConversation(
    conversationId: string,
    messages: Array<any>,
    stage: ConversationStage,
    language: 'en' | 'ne',
    userId?: string,
    collectedDetails?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('conversations')
            .upsert({
                conversation_id: conversationId,
                messages: messages,
                current_stage: stage,
                language: language,
                user_id: userId,
                collected_details: collectedDetails,
                last_message_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        console.log('[Supabase] ✓ Saved conversation:', conversationId);
        return { success: true };
    } catch (error) {
        console.error('[Supabase] ✗ Error saving conversation:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('conversation_id', conversationId)
            .single();

        if (error) throw error;
        return data as Conversation;
    } catch (error) {
        console.error('[Supabase] ✗ Error fetching conversation:', error);
        return null;
    }
}

/**
 * Delete old conversations (cleanup - optional)
 */
export async function deleteOldConversations(daysOld: number = 30): Promise<number> {
    if (!supabase) return 0;

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const { data, error } = await supabase
            .from('conversations')
            .delete()
            .lt('updated_at', cutoffDate.toISOString())
            .select();

        if (error) throw error;

        const deletedCount = data?.length || 0;
        console.log(`[Supabase] ✓ Deleted ${deletedCount} old conversations`);
        return deletedCount;
    } catch (error) {
        console.error('[Supabase] ✗ Error deleting old conversations:', error);
        return 0;
    }
}

/**
 * Check if Supabase is configured and connected
 */
export async function checkSupabaseConnection(): Promise<{
    configured: boolean;
    connected: boolean;
    error?: string;
}> {
    if (!supabase) {
        return { configured: false, connected: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true });

        if (error) throw error;

        return { configured: true, connected: true };
    } catch (error) {
        return {
            configured: true,
            connected: false,
            error: String(error)
        };
    }
}
