/**
 * API Route: Send message via OpenClaw to Telegram
 * POST /api/telegram/send
 */

import { NextRequest, NextResponse } from 'next/server';
import openClawClient from '@/lib/integrations/openclaw-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatId, text, replyMarkup } = body;

        if (!chatId || !text) {
            return NextResponse.json(
                { error: 'Missing required fields: chatId, text' },
                { status: 400 }
            );
        }

        // Ensure OpenClaw is connected
        if (openClawClient.getState() !== 'connected') {
            console.log('[API] OpenClaw not connected, attempting to connect...');
            await openClawClient.connect();

            // Wait a bit for connection
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (openClawClient.getState() !== 'connected') {
                return NextResponse.json(
                    { error: 'OpenClaw gateway not connected' },
                    { status: 503 }
                );
            }
        }

        // Send message
        const success = await openClawClient.sendMessage({
            chatId,
            text,
            replyMarkup,
        });

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to send message via OpenClaw' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error in /api/telegram/send:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
