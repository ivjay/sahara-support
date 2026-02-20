import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple client - timeouts handled at the call site
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Save or update conversation in Supabase
 */
export async function saveConversation(data: {
    conversation_id: string;
    messages: Array<{ role: string; content: string }>;
    stage: string;
    language: string;
    collected_details: Record<string, string>;
    user_id?: string; // Optional user isolation
}) {
    try {
        const { error } = await supabase
            .from('conversations')
            .upsert({
                conversation_id: data.conversation_id,
                user_id: data.user_id || 'guest', // ✅ Track user
                messages: data.messages,
                stage: data.stage,
                language: data.language,
                booking_type: null,
                collected_details: data.collected_details,
                updated_at: new Date().toISOString()
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
 * Profile Management
 */
export async function getProfile(userId: string) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // PGRST116 = no rows found (normal case for new users)
        // PGRST204 = table doesn't exist (need to run migration)
        if (error && error.code !== 'PGRST116') {
            if (error.code === 'PGRST204' || error.message?.includes('406')) {
                console.warn('[Supabase] ⚠ Profiles table not found. Run RUN_THIS_IN_SUPABASE.sql');
                return null;
            }
            console.error('[Supabase] ✗ Error fetching profile:', error);
            return null;
        }

        return data;
    } catch (err) {
        console.warn('[Supabase] Profile fetch failed:', err);
        return null;
    }
}

export async function updateProfile(userId: string, profile: Record<string, unknown>) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            user_id: userId,
            ...profile,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id'
        })
        .select()
        .single();

    if (error) {
        console.error('[Supabase] ✗ Error updating profile:', error);
        throw error;
    }

    return data;
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
    details: Record<string, unknown>;
    total_price: number;
    status: string;
}) {
    try {
        console.log('[Supabase] Creating booking:', {
            id: data.booking_id,
            type: data.booking_type,
            price: data.total_price,
            status: data.status
        });

        const bookingData = {
            booking_id: data.booking_id,  // ✅ Fixed: Use booking_id (not id)
            booking_type: data.booking_type,
            details: data.details || {},  // ✅ Fixed: Column is called 'details' (not booking_data)
            user_id: null, // ✅ Add user tracking later if needed
            total_price: data.total_price,
            status: data.status.toLowerCase(), // Ensure lowercase for consistency
            created_at: new Date().toISOString()
        };

        const { data: insertedData, error } = await supabase
            .from('bookings')
            .insert(bookingData)
            .select()
            .single();

        if (error) {
            console.error('[Supabase] ✗ Insert error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Supabase error: ${error.message} (${error.code || 'unknown'})`);
        }

        console.log('[Supabase] ✓ Booking created successfully:', data.booking_id);
        return insertedData;
    } catch (error) {
        console.error('[Supabase] Booking creation failed:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
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
            .eq('booking_id', bookingId)  // ✅ Fixed: Query by booking_id (not id)
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
    } catch (error) {
        return { configured: true, connected: false, error: error instanceof Error ? error.message : String(error) };
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