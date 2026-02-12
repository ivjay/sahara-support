import { BookingRecord } from "./booking-context";

// API Wrapper to abstract fetch calls
export const BookingApi = {
    async getAll(): Promise<BookingRecord[]> {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch bookings");
        return res.json();
    },

    async create(booking: BookingRecord): Promise<BookingRecord> {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking),
            cache: 'no-store'
        });
        if (!res.ok) throw new Error("Failed to create booking");
        return res.json();
    },

    async verify(id: string, status: 'Confirmed' | 'Cancelled' = 'Confirmed'): Promise<BookingRecord> {
        const res = await fetch('/api/bookings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
            cache: 'no-store'
        });
        if (!res.ok) throw new Error("Failed to update booking status");
        return res.json();
    },

    async deleteAll(): Promise<void> {
        const res = await fetch('/api/bookings', {
            method: 'DELETE',
            cache: 'no-store'
        });
        if (!res.ok) throw new Error("Failed to clear bookings");
    }
};
