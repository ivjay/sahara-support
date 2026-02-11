import fs from 'fs/promises';
import path from 'path';
import { BookingRecord } from '@/lib/services/booking-context';

// In a real app, this would be a Postgres connection
// For now, it's a persistent JSON file on the server.
const DB_PATH = path.join(process.cwd(), 'data', 'bookings.json');

// Ensure data directory exists
async function ensureDb() {
    try {
        await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
        try {
            await fs.access(DB_PATH);
        } catch {
            await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
        }
    } catch (error) {
        console.error("DB Init Error:", error);
    }
}

export interface BookingRepository {
    getAll(): Promise<BookingRecord[]>;
    getById(id: string): Promise<BookingRecord | undefined>;
    create(booking: BookingRecord): Promise<BookingRecord>;
    updateStatus(id: string, status: BookingRecord['status']): Promise<BookingRecord | null>;
}

// File-based implementation with robust error handling
const readDb = async (): Promise<BookingRecord[]> => {
    try {
        await ensureDb();
        const data = await fs.readFile(DB_PATH, 'utf-8');
        try {
            return JSON.parse(data);
        } catch (parseError) {
            console.error("DB Parsing Error (Resetting):", parseError);
            // If corrupt, backup and reset
            try {
                await fs.rename(DB_PATH, `${DB_PATH}.corrupt.${Date.now()}`);
            } catch { }
            return [];
        }
    } catch (err) {
        console.error("DB Read Error:", err);
        return [];
    }
};

const writeDb = async (data: BookingRecord[]) => {
    try {
        await ensureDb();
        // Simple write for now, can be upgraded to atomic write if needed
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("DB Write Error:", err);
        throw err;
    }
};

export const db: BookingRepository = {
    async getAll() {
        return readDb();
    },

    async getById(id: string) {
        const all = await readDb();
        return all.find(b => b.id === id);
    },

    async create(booking: BookingRecord) {
        const all = await readDb();
        // Prevent duplicates if already exists (idempotency)
        if (all.some(b => b.id === booking.id)) return booking;

        const updated = [booking, ...all];
        await writeDb(updated);
        return booking;
    },

    async updateStatus(id: string, status: BookingRecord['status']) {
        const all = await readDb();
        const index = all.findIndex(b => b.id === id);

        if (index === -1) return null;

        all[index] = { ...all[index], status };
        await writeDb(all);
        return all[index];
    }
};
