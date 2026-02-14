import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save or update conversation in Supabase
 */
export async function saveConversation(data: {
    conversation_id: string;
    messages: any[];
    stage: string;
    language: string;
    collected_details: any;
}) {
    try {
        // ✅ FIX: Match the exact table structure
        const { error } = await supabase
            .from('conversations')
            .upsert({
                conversation_id: data.conversation_id,
                messages: data.messages,
                stage: data.stage,
                language: data.language,
                booking_type: null, // ✅ Add this field
                collected_details: data.collected_details,
                updated_at: new Date().toISOString() // ✅ Explicitly set updated_at
            }, {
                onConflict: 'conversation_id'
            });

        if (error) {
            console.error('[Supabase] ✗ Error saving conversation:', error);
            throw error;
        }

        console.log('[Supabase] ✓ Conversation saved');
    } catch (error) {
        console.error('[Supabase] Save failed:', error);
        throw error;
    }
}

/**
 * Get conversation by ID
 */
export async function getConversation(conversationId: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

    if (error) {
        console.error('[Supabase] ✗ Error fetching conversation:', error);
        return null;
    }

    return data;
}

/**
 * Create a booking in Supabase
 */
export async function createBooking(data: {
    booking_id: string;
    booking_type: string;
    details: any;
    total_price: number;
    status: string;
}) {
    try {
        const { error } = await supabase
            .from('bookings')
            .insert({
                id: data.booking_id,
                booking_type: data.booking_type,
                booking_data: data.details,
                user_id: null, // ✅ Add user tracking later if needed
                total_price: data.total_price,
                status: data.status,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('[Supabase] ✗ Error creating booking:', error);
            throw error;
        }

        console.log('[Supabase] ✓ Booking created:', data.booking_id);
    } catch (error) {
        console.error('[Supabase] Booking creation failed:', error);
        throw error;
    }
}

/**
 * Updates an existing booking status
 */
export async function updateBookingStatus(bookingId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] ✗ Error updating booking status:', error);
            throw error;
        }
        return data;
    } catch (error) {
        console.error('[Supabase] Update failed:', error);
        throw error;
    }
}

/**
 * Checks if Supabase is correctly configured and reachable
 */
export async function checkSupabaseConnection() {
    const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isConfigured) {
        return { configured: false, connected: false, error: 'Missing environment variables' };
    }

    try {
        const { error } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).limit(1);
        if (error) throw error;
        return { configured: true, connected: true };
    } catch (error: any) {
        return { configured: true, connected: false, error: error.message };
    }
}

/**
 * Generate a unique booking ID
 */
export function generateBookingId(type: string): string {
    const prefix = type.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}