/**
 * API Route: Get integration status
 * GET /api/telegram/status
 */

import { NextResponse } from 'next/server';
import openClawClient from '@/lib/integrations/openclaw-service';
import { healthCheck } from '@/lib/integrations/ollama-service';

export async function GET() {
    try {
        // Check OpenClaw connection
        const openclawState = openClawClient.getState();
        const lastMessage = openClawClient.getLastMessageTimestamp();

        // Check Ollama health
        const ollamaHealth = await healthCheck();

        return NextResponse.json({
            openclaw: {
                state: openclawState,
                connected: openclawState === 'connected',
                lastMessageTimestamp: lastMessage,
                lastMessageAgo: lastMessage ? Date.now() - lastMessage : null,
            },
            ollama: {
                status: ollamaHealth.status,
                healthy: ollamaHealth.status === 'healthy',
                model: ollamaHealth.model,
                error: ollamaHealth.error,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[API] Error checking status:', error);
        return NextResponse.json(
            {
                error: 'Failed to check integration status',
                openclaw: { state: 'error', connected: false },
                ollama: { status: 'unhealthy', healthy: false },
            },
            { status: 500 }
        );
    }
}
