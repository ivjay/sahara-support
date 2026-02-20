import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const { data: services, error } = await supabase
            .from('services')
            .select('service_id, type, title, subtitle, details')
            .eq('available', true)
            .order('type', { ascending: true })
            .limit(20);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Format for easy reading
        const formatted = services?.map(s => ({
            id: s.service_id,
            type: s.type,
            title: s.title,
            subtitle: s.subtitle,
            details: {
                from: s.details?.from || '❌ MISSING',
                to: s.details?.to || '❌ MISSING',
                departure: s.details?.departure || '❌ MISSING',
                duration: s.details?.duration || '-',
                hospital: s.details?.hospital || (s.type === 'appointment' ? '❌ MISSING' : '-'),
                address: s.details?.address || '-',
                cinema: s.details?.cinema || (s.type === 'movie' ? '❌ MISSING' : '-'),
                showtime: s.details?.showtime || '-',
                busType: s.details?.busType || '-',
                aircraft: s.details?.aircraft || '-',
            }
        }));

        return NextResponse.json({
            total: services?.length || 0,
            services: formatted
        }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
    }
}
