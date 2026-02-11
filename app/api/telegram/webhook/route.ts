/**
 * API Route: Webhook for incoming Telegram messages via OpenClaw
 * POST /api/telegram/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractIntent } from '@/lib/integrations/intent-extractor';
import skills from '@/lib/integrations/openclaw-skills';
import openClawClient from '@/lib/integrations/openclaw-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatId, text, from } = body;

        if (!chatId || !text) {
            return NextResponse.json(
                { error: 'Missing required fields: chatId, text' },
                { status: 400 }
            );
        }

        console.log(`[Webhook] Received message from ${from?.username || chatId}: ${text}`);

        // Extract intent using Ollama
        const intentResult = await extractIntent(text);

        console.log(`[Webhook] Intent: ${intentResult.intent}, Confidence: ${intentResult.confidence}`);

        let responseText = '';
        let options: any[] = [];

        // Handle different intents
        switch (intentResult.intent) {
            case 'BUS_BOOKING':
                if (intentResult.data.from && intentResult.data.to) {
                    const result = skills.queryBusAvailability(
                        intentResult.data.from,
                        intentResult.data.to,
                        intentResult.data.date
                    );
                    responseText = result.message;
                    if (result.options.length > 0) {
                        responseText += '\n\n' + skills.formatOptionsForTelegram(result.options);
                    }
                } else {
                    responseText = intentResult.next_question || 'Kahaa bata kahaa jana lai? (Where from and to?)';
                }
                break;

            case 'FLIGHT_BOOKING':
                if (intentResult.data.from && intentResult.data.to) {
                    const result = skills.queryFlightAvailability(
                        intentResult.data.from,
                        intentResult.data.to,
                        intentResult.data.date
                    );
                    responseText = result.message;
                    if (result.options.length > 0) {
                        responseText += '\n\n' + skills.formatOptionsForTelegram(result.options);
                    }
                } else {
                    responseText = intentResult.next_question || 'Kahaa bata kahaa jana lai flight chaiyeko? (Where do you need the flight from and to?)';
                }
                break;

            case 'APPOINTMENT':
                if (intentResult.data.specialty || intentResult.data.service_type) {
                    const category = intentResult.data.specialty || intentResult.data.service_type;
                    const result = skills.listServiceProviders(category, intentResult.data.location);
                    responseText = result.message;
                    if (result.options.length > 0) {
                        responseText += '\n\n' + skills.formatOptionsForTelegram(result.options);
                    }
                } else {
                    responseText = intentResult.next_question || 'Kun type ko service chaiyeko? (What type of service do you need?)';
                }
                break;

            case 'MOVIE_BOOKING':
                const movieResult = skills.listMovies(
                    intentResult.data.city,
                    intentResult.data.date
                );
                responseText = movieResult.message;
                if (movieResult.options.length > 0) {
                    responseText += '\n\n' + skills.formatOptionsForTelegram(movieResult.options);
                }
                break;

            case 'GREETING':
                responseText = `Namaste! 🙏 Main Sahara hun, tapailai k help chaiyeko?\n\n` +
                    `I can help with:\n` +
                    `🚌 Bus tickets\n` +
                    `✈️ Flight bookings\n` +
                    `👨‍⚕️ Doctor appointments\n` +
                    `🎬 Movie tickets\n` +
                    `🏠 Home services (plumber, electrician, etc.)`;
                break;

            case 'GENERAL_QUERY':
            case 'UNKNOWN':
            default:
                if (intentResult.next_question) {
                    responseText = intentResult.next_question;
                } else {
                    responseText = `Maile thik sanga bujhina. (I didn't quite understand.)\n\n` +
                        `Tapai k help chahanuhuncha? (What help do you need?)`;
                }
                break;
        }

        // Send response via OpenClaw
        await openClawClient.sendMessage({
            chatId,
            text: responseText,
        });

        return NextResponse.json({
            success: true,
            intent: intentResult.intent,
            confidence: intentResult.confidence,
        });
    } catch (error) {
        console.error('[Webhook] Error processing message:', error);

        // Try to send error message to user
        try {
            const body = await request.json();
            await openClawClient.sendMessage({
                chatId: body.chatId,
                text: '❌ Sorry, I encountered an error. Please try again.',
            });
        } catch (sendError) {
            console.error('[Webhook] Failed to send error message:', sendError);
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
