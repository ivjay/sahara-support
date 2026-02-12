import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type BookingType = 'movie' | 'bus' | 'flight' | 'doctor' | 'salon';

/**
 * Saves or updates a conversation in Supabase
 */
export async function saveConversation(data: {
    conversation_id: string;
    messages: any[];
    stage: string;
    language: string;
    collected_details: any;
}) {
    const { error } = await supabase
        .from('conversations')
        .upsert({
            conversation_id: data.conversation_id,
            messages: data.messages,
            current_stage: data.stage,
            language: data.language,
            collected_details: data.collected_details,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'conversation_id'
        });

    if (error) {
        console.error('[Supabase] ✗ Error saving conversation:', error);
        throw error;
    }
}

/**
 * Fetches a single conversation by ID
 */
export async function getConversation(conversationId: string) {
    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('[Supabase] ✗ Error fetching conversation:', error);
        throw error;
    }
    return data;
}

/**
 * Creates a new booking in Supabase
 */
export async function createBooking(data: {
    booking_id: string;
    booking_type: string;
    details: any;
    total_price: number;
    status?: string;
    user_id?: string;
}) {
    const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
            booking_id: data.booking_id,
            booking_type: data.booking_type,
            details: data.details,
            total_price: data.total_price,
            status: data.status || 'pending',
            user_id: data.user_id || 'anonymous',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('[Supabase] ✗ Error creating booking:', error);
        throw error;
    }
    return booking;
}

/**
 * Updates an existing booking status
 */
export async function updateBookingStatus(bookingId: string, status: string) {
    const { data, error } = await supabase
        .from('bookings')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .select()
        .single();

    if (error) {
        console.error('[Supabase] ✗ Error updating booking status:', error);
        throw error;
    }
    return data;
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
