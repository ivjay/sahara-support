/**
 * OpenClaw Gateway Service
 * Manages WebSocket connection to OpenClaw Telegram gateway
 * Handles message sending/receiving and connection management
 * 
 * NOTE: Requires 'ws' package - install with: npm install ws @types/ws
 */

import { EventEmitter } from 'events';

const OPENCLAW_WS_URL = process.env.OPENCLAW_WS_URL || 'ws://127.0.0.1:18789';
const OPENCLAW_AUTH_TOKEN = process.env.OPENCLAW_AUTH_TOKEN || '';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OpenClawMessage {
    chatId: string;
    text: string;
    timestamp: number;
    messageId?: number;
    from?: {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
    };
}

export interface OpenClawOutgoingMessage {
    chatId: string;
    text: string;
    replyMarkup?: any;
}

/**
 * OpenClaw Gateway Client
 * Singleton pattern for managing WebSocket connection
 */
class OpenClawClient extends EventEmitter {
    private ws: any | null = null; // Will be WebSocket after installing 'ws' package
    private state: ConnectionState = 'disconnected';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private lastMessageTimestamp: number = 0;

    constructor() {
        super();
    }

    /**
     * Connect to OpenClaw gateway
     */
    async connect(): Promise<void> {
        if (this.state === 'connected' || this.state === 'connecting') {
            console.log('[OpenClaw] Already connected or connecting');
            return;
        }

        this.state = 'connecting';
        this.emit('stateChange', this.state);

        try {
            console.log(`[OpenClaw] Connecting to ${OPENCLAW_WS_URL}...`);

            // @ts-ignore - WebSocket will be available after installing 'ws' package
            const WebSocket = require('ws');
            this.ws = new WebSocket(OPENCLAW_WS_URL, {
                headers: {
                    'Authorization': `Bearer ${OPENCLAW_AUTH_TOKEN}`,
                },
            });

            this.ws.on('open', () => this.handleOpen());
            this.ws.on('message', (data: any) => this.handleMessage(data));
            this.ws.on('error', (error: Error) => this.handleError(error));
            this.ws.on('close', () => this.handleClose());

        } catch (error) {
            console.error('[OpenClaw] Connection error:', error);
            this.state = 'error';
            this.emit('stateChange', this.state);
            this.emit('error', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Disconnect from gateway
     */
    disconnect(): void {
        console.log('[OpenClaw] Disconnecting...');
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.state = 'disconnected';
        this.emit('stateChange', this.state);
    }

    /**
     * Send message to Telegram chat via OpenClaw
     */
    async sendMessage(message: OpenClawOutgoingMessage): Promise<boolean> {
        if (this.state !== 'connected' || !this.ws) {
            console.error('[OpenClaw] Cannot send message - not connected');
            return false;
        }

        try {
            const payload = JSON.stringify({
                type: 'sendMessage',
                ...message,
            });

            this.ws.send(payload);
            console.log(`[OpenClaw] ✓ Message sent to chat ${message.chatId}`);
            return true;
        } catch (error) {
            console.error('[OpenClaw] ✗ Failed to send message:', error);
            return false;
        }
    }

    /**
     * Get current connection state
     */
    getState(): ConnectionState {
        return this.state;
    }

    /**
     * Get last message timestamp
     */
    getLastMessageTimestamp(): number {
        return this.lastMessageTimestamp;
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        console.log('[OpenClaw] ✓ Connected to gateway');
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.emit('stateChange', this.state);
        this.emit('connected');

        // Start heartbeat
        this.startHeartbeat();
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(data: any): void {
        try {
            const message = JSON.parse(data.toString());
            console.log('[OpenClaw] ← Received message:', message);

            this.lastMessageTimestamp = Date.now();

            // Emit different events based on message type
            if (message.type === 'telegramMessage') {
                const telegramMsg: OpenClawMessage = {
                    chatId: message.chat.id.toString(),
                    text: message.text || '',
                    timestamp: message.date * 1000,
                    messageId: message.message_id,
                    from: message.from,
                };
                this.emit('message', telegramMsg);
            } else if (message.type === 'pong') {
                // Heartbeat response
                console.log('[OpenClaw] Heartbeat pong received');
            } else {
                this.emit('rawMessage', message);
            }
        } catch (error) {
            console.error('[OpenClaw] Failed to parse message:', error);
        }
    }

    /**
     * Handle WebSocket error
     */
    private handleError(error: Error): void {
        console.error('[OpenClaw] ✗ WebSocket error:', error);
        this.state = 'error';
        this.emit('stateChange', this.state);
        this.emit('error', error);
    }

    /**
     * Handle WebSocket close
     */
    private handleClose(): void {
        console.log('[OpenClaw] Connection closed');

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        } else {
            this.state = 'disconnected';
            this.emit('stateChange', this.state);
            this.emit('disconnected');
        }
    }

    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect(): void {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, delay);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.state === 'connected') {
                try {
                    this.ws.send(JSON.stringify({ type: 'ping' }));
                } catch (error) {
                    console.error('[OpenClaw] Heartbeat failed:', error);
                }
            }
        }, 30000); // Every 30 seconds
    }
}

// Singleton instance
const openClawClient = new OpenClawClient();

export default openClawClient;
export { openClawClient };
