import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health - Check system health and configuration
 */
export async function GET() {
    const health: {
        status: string;
        timestamp: string;
        environment: string;
        checks: {
            supabase: {
                configured: boolean;
                url: string;
                anonKey: string;
                connected?: boolean;
                error?: string;
            };
            firebase: {
                configured: boolean;
                apiKey: string;
                authDomain: string;
            };
            ollama: {
                configured: boolean;
                baseUrl: string;
            };
        };
        warnings: string[];
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        checks: {
            supabase: {
                configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
                url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
                anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
            },
            firebase: {
                configured: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing'
            },
            ollama: {
                configured: !!process.env.OLLAMA_BASE_URL,
                baseUrl: process.env.OLLAMA_BASE_URL || 'Not set'
            }
        },
        warnings: []
    };

    // Add warnings for missing critical configs
    if (!health.checks.supabase.configured) {
        health.warnings.push('Supabase not configured - bookings and services will fail');
    }

    if (!health.checks.firebase.configured) {
        health.warnings.push('Firebase not configured - authentication will fail');
    }

    // Test Supabase connection
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('services')
            .select('count')
            .limit(1);

        if (error) {
            health.checks.supabase.connected = false;
            health.checks.supabase.error = error.message;
            health.warnings.push(`Supabase connection failed: ${error.message}`);
        } else {
            health.checks.supabase.connected = true;
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        health.checks.supabase.connected = false;
        health.checks.supabase.error = errMsg;
        health.warnings.push(`Supabase test failed: ${errMsg}`);
    }

    return NextResponse.json(health);
}
